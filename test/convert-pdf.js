// testing dependencies
const chai = require("chai")
const chaiHttp = require("chai-http")
const should = chai.should()
// const server = require('./../index.js')
const config = require('config')
const server = config.get("Testing.url")

chai.use(chaiHttp)

// utility dependencies
const fs = require('fs')

describe("PDF upload", () => {
  it("should PUT my pdf", (done) => {
    fs.readFile('./test/pdf/test.pdf', (err, data) => {

      if (err) { console.error(err) }
      else {
        chai.request(server)
          .put('/v1/pdf')
          .set('Content-Type', 'application/pdf')
          .send(data)
          .end((err, res) => {
            console.log("got the res")
            console.log(res.body)
            res.should.have.status(201)
            res.body.should.have.property("pages")
            res.body.pages.should.be.instanceOf(Array)
            res.body.pages.length.should.be.equal(1)

            done()
          })
      }
    })
  })
})