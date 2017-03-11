const express = require('express')
const bodyParser = require('body-parser')
const im = require('imagemagick')
const fs = require('fs')

const app = express()

const PORT = process.env.PORT || 4250

let counter = 0

app.use(bodyParser.json({limit: '500kb'}))
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
    console.log(req.body.pdf.data)
    // open a file for writing - wx creates the path if it does not exist and throws an error if it does
    fs.open('./content/output/tester.pdf', 'wx', (err, fd) => {
        if (err) { console.error(err) }
        else {
            // write the req.body (which is a buffer created by body-parser) to the opened file
            fs.write(fd, req.body.pdf.data, (err, written, buff) => {
                console.log("wrote that pdf")
                if (err) {
                    console.error(err)
                    res.status(500).send({ message: err })
                }
                else {
                    console.log("written:", written)
                    res.status(500).send({ message: "wrote " + written + " bytes to test.pdf" })
                }
            })
        }
    })



    
})

app.listen(PORT, () => {
  console.log("Sunstreaker listening on " + PORT)
})

module.exports = app