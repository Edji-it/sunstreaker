const express = require('express')
const fs = require('fs')
const bodyParser = require('body-parser')
const config = require('config')
const im = require('imagemagick')
const uuid = require('uuid')
const aws = require('aws-sdk')
const Q = require('q')
const lib = require('./lib')

aws.config.update({ region: 'us-west-2' }) // update the aws region we're referencing

const S3_BUCKET = process.env.S3_BUCKET || "image-dev.edji.it"
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
    const s3 = new aws.S3() // aws.S3 automatically grabs AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from the environment as credentials
    let savePath = config.get("CONVERT_PDF").LOCAL_STORAGE
    let fileName = uuid.v4()
    let pdfPath = [ savePath, "pdf", fileName ].join("/") + ".pdf"
    let imgPath = [ savePath, "img", fileName ].join("/") + ".jpg"
    let pathToImgs = [ savePath, "img" ].join("/")

    if (!req.body && req.body) {
        res.status(400).send()
        return
    }

    lib.savePdf(pdfPath, req.body)
        .then((written, buff) => { // don't see a reason to use the buffer again, but maybe someday we will so I left it
            return new Promise((resolve, reject) => {
                im.convert([ "-density", "72", pdfPath, imgPath ], (err, stdout) => {
                    if (err) {
                        reject(err) // will be caught by .catch
                    } else {
                        resolve()
                    }
                })
            })
        })
        .then(() => {
            return new Promise((resolve, reject) => {
                // read the files in the img directory
                fs.readdir([savePath, "img"].join("/"), (err, files) => {
                    if (err) { reject(err) }
                    else { resolve(files) }
                })
            })
        })
        .then((files) => {
            // console.log(files)
            let promises = []
            files.forEach((file) => {
                promises.push(
                    new Promise((resolve, reject) => {
                        // test if the file is one of the ones created by this call by checking the name
                        if (file.substr(0, fileName.length) === fileName) {
                            console.log(file)
                            // read the file into a buffer
                            fs.readFile([ pathToImgs, file ].join("/"), (err, imgData) => {
                                let awsPath = `pdf/${fileName}/${file}` // where we will save the image in s3
                                s3.putObject({
                                    Bucket: S3_BUCKET,
                                    Key: awsPath,
                                    Body: imgData,
                                    ACL: 'public-read'
                                }, (err, data) => {
                                    if (err) {
                                        reject(err)
                                    } else {
                                        resolve(awsPath)
                                    }
                                })
                            })
                        }
                    })
                )
            })
            return promises
        })
        .then((promises) => {
            console.log("got the promises")
            Promise.all(promises).done((files) => {
                console.log(files)
                res.status(202).send(files)
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