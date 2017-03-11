// testing dependencies
const chai = require("chai")
const chaiHttp = require("chai-http")
const should = chai.should()
const server = require('./../index.js')

chai.use(chaiHttp)

// utility dependencies
const fs = require('fs')

describe("PDF upload", () => {
  it("should run my test", (done) => {
    fs.readFile('./content/pdf/lockheed.pdf', (err, res) => {
      if (err) { console.error(err) }
      else {
        chai.request(server)
          .put('/v1/convert-pdf')
          .send({ pdf: res })
          .end((err, res) => {
            console.log("got the res")
            if (err) { console.error(err) }
            else { console.log(res.body) }

            done()
          })
      }
    })
  })
})