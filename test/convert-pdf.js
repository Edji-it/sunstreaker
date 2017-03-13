// testing dependencies
const chai = require("chai")
const chaiHttp = require("chai-http")
const should = chai.should()
const config = require('config')
const server = config.get("Testing.url")

chai.use(chaiHttp)

// utility dependencies
const fs = require('fs')

describe("PDF upload", () => {
  it("should PUT a single-page pdf", (done) => {
    fs.readFile('./test/pdf/test.pdf', (err, data) => {

      if (err) { console.error(err) }
      else {
        chai.request(server)
          .put('/v1/pdf')
          .set('Content-Type', 'application/pdf')
          .send(data)
          .end((err, res) => {
            res.should.have.status(201)
            res.body.should.not.have.property("errors")
            res.body.should.have.property("pages")
            res.body.pages.should.be.instanceOf(Array)
            res.body.pages.length.should.be.equal(1)

            done()
          })
      }
    })
  })

  it("should not PUT a pdf without application/pdf header", (done) => {
    fs.readFile('./test/pdf/test.pdf', (err, data) => {

      if (err) { console.error(err) }
      else {
        chai.request(server)
          .put('/v1/pdf')
          // .set('Content-Type', 'application/pdf') // we are not setting this header for this test
          .send(data)
          .end((err, res) => {
            res.should.have.status(400)
            res.body.should.have.property("errors")
            res.body.should.not.have.property("pages")
            res.body.errors.should.have.property("typeError")
            res.body.errors.typeError.should.be.a("string")

            done()
          })
      }
    })
  })

  it("should reject a pdf larger than 5 mb", (done) => {
    fs.readFile('./test/pdf/lockheed.pdf', (err, data) => {

      if (err) { console.error(err) }
      else {
        chai.request(server)
          .put('/v1/pdf')
          .set('Content-Type', 'application/pdf')
          .send(data)
          .end((err, res) => {
            res.should.have.status(413)

            done()
          })
      }
    })
  })
})