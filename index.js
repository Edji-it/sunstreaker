const express = require('express')
const fs = require('fs')
const bodyParser = require('body-parser')
const config = require('config')
const im = require('imagemagick')
const uuid = require('uuid')
const lib = require('./lib')

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

app.put('/v1/convert-pdf', (req, res) => {
    // if (!req.body || !req.body.pdf) { res.status(400).send() }
    // else { console.log("got that pdf tho"); }
    counter++
    res.status(202).send({ message: "we're working on it, alright?!" })

    console.log("beginning image conversion")
    im.convert(["-density", "144", "./content/pdf/test.pdf", `./tmp/test_${counter}.jpg`], (err, stdout) => {
        if (err) {
            console.error(err)
        } else {
            console.log(stdout)
            console.log("finished converting pdfs");
            fs.readdir("./tmp", (err, files) => {
                if (err) { console.error(err) }
                else { files.forEach((file) => {
                    console.log(file)
                })}
            })
        }
    })
})

app.put('/v1/pdf', (req, res) => {
    let savePath = config.get("CONVERT_PDF").LOCAL_STORAGE
    let fileName = uuid.v4()
    let pdfPath = [ savePath, "pdf", fileName ].join("/") + ".pdf"
    let imgPath = [ savePath, "img", fileName ].join("/") + ".jpg"
    console.log(req.body)

    lib.savePdf(pdfPath, req.body.pdf.data)
        .then((written, buff) => { // don't see a reason to use the buffer again, but maybe someday we will so I left it
            console.log("successfully got pdf")
            im.convert([ "-density", "144", pdfPath, imgPath ], (err, stdout) => {
                if (err) {
                    throw err // will be caught by catch
                } else {
                    console.log("finished converting pdfs");
                    res.status(202).send({ message: `Wrote ${ written } bytes to file` })
                }
            })
        })
        .catch((err) => {
            console.error(err)
            res.status(500).send(err)
        })
})

app.listen(PORT, () => {
  console.log("Sunstreaker listening on " + PORT)
})

module.exports = app