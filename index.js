const express = require('express')
const fs = require('fs')
const bodyParser = require('body-parser')
const config = require('config')
const im = require('imagemagick')
const uuid = require('uuid')
const Q = require('q')

const lib = require('./lib')
let aws = require('./aws')

const app = express()
const PORT = process.env.PORT || 4250

let counter = 0

app.use(bodyParser.json({ limit: '500kb' }))
app.use(bodyParser.raw({ limit: '10mb', type: 'application/pdf' }))

// Access allowed for development (CORS stuff)
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    // res.setHeader('Access-Control-Allow-Origin', '*')
    let oneof = false
    if(req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin)
        res.header('Access-Control-Allow-Credentials', true)
        oneof = true
    }
    if(req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method'])
        oneof = true
    }

    if (req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'])
        oneof = true
    } 
    // else {
    //     // Request headers you wish to allow
    //     res.header('Access-Control-Allow-Headers', 'authorization, content-type, accept, origin')
    // }

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true)

    // Pass to next layer of middleware
    next()
})

app.put('/v1/pdf', (req, res) => {

    // the process will crash if the server tries assuming application/json
    let contentType = req.headers['Content-Type'] || req.headers['content-type']
    if (!contentType || contentType.toLowerCase() !== "application/pdf") {
        return res.status(400).send({ errors: { typeError: "Content-Type not set to application/pdf" } })
    }

    if (!req.body) {
        res.status(400).send()
        return
    }

    let fileId = uuid.v4()
    let savePath = "./content/output/" + fileId
    if (!fs.existsSync(savePath)) {
        fs.mkdirSync(savePath)
    }
    let pdfPath = savePath + "/" + fileId + ".pdf"
    let imgPath = savePath + "/" + fileId
    let placeholder = { converted: false, requestedTime: Date.now() }
    let statusLocation = `pdf/${fileId}/spark.json`
    let files = []

    lib.putToS3(statusLocation, JSON.stringify(placeholder))
        .then(() => {

            res.status(202).send({ uuid: fileId })
        })
        .catch((err) => {
            console.log(err)
            res.status(500).send()

            let failedStatus = {
                uuid: fileName,
                converted: false,
                error: err,
                updatedTime: Date.now()
            }
            lib.putToS3(statusLocation, failedStatus)
        })

    console.log("checking pdf")

    lib.savePdf(pdfPath, req.body)
        .then((written, buff) => {
            return new Promise((resolve, reject) => {
                lib.convertPage(savePath, fileId, 0, [], resolve)
            })
        })
        .then((pages) => {
            let statusUpdate = {
                uuid: fileId,
                pages: pages,
                converted: true,
                updatedTime: Date.now()
            }

            return lib.putToS3(statusLocation, JSON.stringify(statusUpdate))
        })
        .then((awsPath) => {
            console.log("done converting pdf at " + awsPath)
        })
        .catch((err) => {
            console.error(err)
            let failedStatus = {
                uuid: fileName,
                converted: false,
                error: err,
                updatedTime: Date.now()
            }
            lib.putToS3(statusLocation, failedStatus)
        })
})

app.listen(PORT, () => {
  console.log("Sunstreaker listening on " + PORT)
})

module.exports = app