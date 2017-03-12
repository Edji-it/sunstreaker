const im = require('imagemagick')
const fs = require('fs')

module.exports = {
  savePdf: function(loc, buff) {
    return new Promise((resolve, reject) => {
      fs.open(loc, 'wx', (err, fd) => {
          if (err) { console.error(err) }
          else {
              let pdf = new Uint8Array(buff)
              console.log("pdf", pdf)
              // write the req.body (which is a buffer created by body-parser) to the opened file
              fs.write(fd, pdf, (err, written, buff) => {
                  if (err) {
                      reject(err)
                  }
                  else {

                      fs.exists(loc, (exists) => {
                          if (exists) { resolve(written, buff) }
                          else { reject("File was not created") }
                      })
                  }
              })
          }
      })
    })
  }
}