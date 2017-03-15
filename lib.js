const im = require('imagemagick')
const fs = require('fs')

let aws = require('./aws')

module.exports = {
    savePdf: function(loc, buff) {
        return new Promise((resolve, reject) => {
            fs.open(loc, 'wx', (err, fd) => {
            if (err) { console.error(err) }
            else {
                // write the req.body (which is a buffer created by body-parser) to the opened file
                fs.write(fd, buff, (err, written, buff) => {
                    if (err) {
                        reject(err)
                    } else {
                        fs.exists(loc, (exists) => {
                            if (exists) {
                                resolve(written, buff)
                            } else {
                                reject("File was not created")
                            }
                        })
                    }
                })
            }
            })
        })
    },
    // recursive function that repeats everything inside until it encounters an error
    convertPage: function(pdfPath, imgPath, pageNum, callback) {
        let resultPath = `${imgPath}-${pageNum}.jpg`
        im.convert(['-density', '144', `${pdfPath}[${pageNum}]`, resultPath ], (err, stdout) => {
            // we resolve with false to tell the running process that the page was not found - we are assuming that this is the reason for the error
            if (err) { callback(pageNum) }
            else {
                pageNum ++ // set up for moving on to the next page
                this.convertPage(pdfPath, imgPath, pageNum, callback)
            }
        })
    },
    putToS3: function(imgPath, dirName, fileName) {
        // read the file in, which presumably has the pdf's image
        return new Promise((resolve, reject) => {
            fs.readFile(imgPath, (err, imgBuff) => {
                if (err) { throw err }
                else { resolve(imgBuff) }
            })
        })
        .then((buff) => {
            // send the image to s3
            let awsPath = `pdf/${dirName}/${fileName}`
            return new Promise((resolve, reject) => {
                aws.s3.putObject({
                    Bucket: aws.S3_BUCKET,
                    Key: awsPath,
                    Body: imgBuff,
                    ACL: 'public-read'
                }, (err, res) => {
                    if (err) { throw err }
                    else { resolve(awsPath) }
                })
            })
        })
        .then((awsPath) => {
            // delete the image on local storage and resolve with the path to the image in AWS
            return new Promise((resolve, reject) => {
                fs.unlink(imgPath, (err) => {
                    if (err) { throw err }
                    else { resolve(awsPath) }
                })
            })
        })
    }
}