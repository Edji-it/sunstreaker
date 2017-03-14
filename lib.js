const im = require('imagemagick')
const fs = require('fs')

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
    // convertPage: function(pdfPath, imgPath, pageNum) {
    //     return new Promise((resolve, reject) => {
    //         im.convert(['-density', '144', `${pdfPath}[${pageNum}]`, `${imgPath}-${pageNum}.jpg`], (err, stdout) => {
    //             // we resolve with false to tell the running process that the page was not found - we are assuming that this is the reason for the error
    //             if (err) { reject(err) }
    //             else { convertPage(pdfPath, imgPath, pageNum) }
    //         })
    //     })
    // },
    // convertPage: function(pdfPath, imgPath, pageNum) {
    //     return new Promise((resolve, reject) => {
    //         im.convert(['-density', '144', `${pdfPath}[${pageNum}]`, `${imgPath}-${pageNum}.jpg`], (err, stdout) => {
    //             // we resolve with false to tell the running process that the page was not found - we are assuming that this is the reason for the error
    //             if (err) { reject(err) }
    //             else { resolve() }
    //         })
    //     })
    // },

    // recursive function that repeats everything inside until it encounters an error
    convertPage: function(pdfPath, imgPath, pageNum, callback) {
        im.convert(['-density', '144', `${pdfPath}[${pageNum}]`, `${imgPath}-${pageNum}.jpg`], (err, stdout) => {
            // we resolve with false to tell the running process that the page was not found - we are assuming that this is the reason for the error
            if (err) { callback(pageNum) }
            else {
                pageNum ++
                this.convertPage(pdfPath, imgPath, pageNum, callback)
            }
        })
    }
}