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

// app.put('/v1/pdf', (req, res) => {

//     // the process will crash if the server tries assuming application/json
//     let contentType = req.headers['Content-Type'] || req.headers['content-type']
//     if (!contentType || contentType.toLowerCase() !== "application/pdf") {
//         return res.status(400).send({ errors: { typeError: "Content-Type not set to application/pdf" } })
//     }

//     if (!req.body) {
//         res.status(400).send()
//         return
//     }

//     let savePath = "./content/output"
//     let fileName = uuid.v4()
//     let pdfPath = [ savePath, "pdf", fileName ].join("/") + ".pdf"
//     let imgPath = [ savePath, "img", fileName ].join("/") + ".jpg"
//     let pathToImgs = [ savePath, "img" ].join("/")
//     let placeholder = { converted: false, requestedTime: Date.now() }
//     let statusLocation = `pdf/${fileName}/spark.json`


//     s3.putObject({
//         Bucket: S3_BUCKET,
//         Key: statusLocation,
//         Body: JSON.stringify(placeholder),
//         ACL: 'public-read'
//     }, (err, data) => {
//         res.status(202).send({ uuid: fileName })
//     })

//     lib.savePdf(pdfPath, req.body)
//         .then((written, buff) => { // don't see a reason to use the buffer again, but maybe someday we will so I left it
//             return new Promise((resolve, reject) => {
//                 im.convert([ "-density", "144", pdfPath, imgPath ], (err, stdout) => {
//                     if (err) {
//                         reject(err) // will be caught by .catch
//                     } else {
//                         resolve()
//                     }
//                 })
//             })
//         })
//         .then(() => {
//             return new Promise((resolve, reject) => {
//                 // read the files in the img directory
//                 fs.readdir([savePath, "img"].join("/"), (err, files) => {
//                     if (err) { reject(err) }
//                     else { resolve(files) }
//                 })
//             })
//         })
//         .then((files) => {
//             // console.log(files)
//             let promises = []
//             files.forEach((file) => {
//                 // test if the file is one of the ones created by this call by checking the name
//                 if (file.substr(0, fileName.length) === fileName) {
//                     promises.push(
//                         new Promise((resolve, reject) => {
//                             // read the file into a buffer
//                             fs.readFile([ pathToImgs, file ].join("/"), (err, imgData) => {
//                                 let awsPath = `pdf/${fileName}/${file}` // where we will save the image in s3
//                                 s3.putObject({
//                                     Bucket: S3_BUCKET,
//                                     Key: awsPath,
//                                     Body: imgData,
//                                     ACL: 'public-read'
//                                 }, (err, data) => {
//                                     if (err) {
//                                         reject(err)
//                                     } else {
//                                         resolve(`//${S3_BUCKET}/${awsPath}`)
//                                         // clean up the files
//                                         fs.unlink([ pathToImgs, file ].join("/"), (err) => {
//                                             if (err) { console.error(err) }
//                                         })
//                                     }
//                                 })
//                             }) 
//                         })
//                     )
//                 }
//             })
//             return promises
//         })
//         .then((promises) => {
//             // execute all of the promises returned by the last sequence in the chain
//             Q.all(promises).done((files) => {

//                 // construct new object, which will overwrite the placeholder file
//                 let statusUpdate = {
//                     uuid: fileName,
//                     pages: files,
//                     converted: true,
//                     updatedTime: Date.now()
//                 }

//                 // overwrite the json object that the client will be checking for with the file urls
//                 s3.putObject({
//                     Bucket: S3_BUCKET,
//                     Key: statusLocation,
//                     Body: JSON.stringify(statusUpdate),
//                     ACL: 'public-read'
//                 }, (err, res) => {
//                     if (err) {
//                         console.error(err)
//                         // we will retry once if there was an error the first time
//                         s3.putObject({
//                             Bucket: S3_BUCKET,
//                             Key: statusLocation,
//                             Body: JSON.stringify(statusUpdate),
//                             ACL: 'public-read'
//                         }, (err, res) => {
//                             if (err) {
//                                 console.error("second put error")
//                                 console.error(err)
//                             }
//                         })
//                     } else {
//                         console.log(`//${S3_BUCKET}/${statusLocation}`)
//                     }
//                 })

//                 // also clean up the pdf - now we should have cleaned out all the saved images and the pdf
//                 fs.unlink(pdfPath, (err) => {
//                     if (err) { console.error(err) }
//                 })
//             })
//         })
//         .catch((err) => {
//             console.error(err)

//             let failedStatus = {
//                 uuid: fileName,
//                 converted: false,
//                 error: err,
//                 updatedTime: Date.now()
//             }

//             s3.putObject({
//                 Bucket: S3_BUCKET,
//                 Key: statusLocation,
//                 Body: JSON.stringify(failedStatus),
//                 ACL: 'public-read'
//             }, (err, res) => {
//             })
//         })
// })

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

    // const s3 = new aws.S3() // aws.S3 automatically grabs AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from the environment as credentials
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

    // aws.s3.putObject({
    //     Bucket: aws.S3_BUCKET,
    //     Key: statusLocation,
    //     Body: JSON.stringify(placeholder),
    //     ACL: 'public-read'
    // }, (err, data) => {
    //     res.status(202).send({ uuid: fileId })
    // })

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