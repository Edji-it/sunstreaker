const express = require('express')
const uuid = require('uuid')
let bodyParser = require('body-parser')
let im = require('imagemagick')

const app = express()

const PORT = process.env.PORT || 4250

app.use(bodyParser.json({limit: '10mb'}))

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
  im.convert(["-density", "144", "./content/pdf/lockheed.pdf", "./content/image/lockheed.jpg"], (err, stdout) => {
    if (err) {
        console.error(err)
    } else {
        console.log(stdout)
    }
    
    })
})

app.listen(PORT, () => {
  console.log("Grapple listening on " + PORT)
})
