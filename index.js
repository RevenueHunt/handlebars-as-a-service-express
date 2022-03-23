const express = require('express')
const bodyParser = require('body-parser')
const Handlebars = require('handlebars')
// for checking the hmac
const hmacSHA256 = require('crypto-js/hmac-sha256')
const Base64 = require('crypto-js/enc-base64')

require('dotenv').config()

// Include extra handlebars-helpers
// https://github.com/helpers/handlebars-helpers
var helpers = require('handlebars-helpers')({
  handlebars: Handlebars
});

const app = express()
// Make sure to parse the body as json
app.use(bodyParser.json());

const port = process.env.PORT || 3003

app.post('/', (req, res) => {
  const body = req.body
  const hmac = req.headers['x-hmac-sha256']
  var rendered = ''
  var error = ''

  if(!hmac) {
    console.log('missing hmac')
    res.status(422).json('missing hmac')
    return
  }

  if(!authenticate(body, hmac)) {
    console.log('wrong hmac')
    res.status(401).json('wrong hmac')
    return
  }

  const data = body.data

  console.log(data.quiz_id)
  const template = body.template

  try {
    const h_template = Handlebars.compile(template)
    var rendered = h_template(data)
  } catch (e) {
    error = e.toString().replace(/\n/gi, '<br>')
    console.log(error)
  }

  res.send({
    rendered: rendered,
    error: error
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

function authenticate(body, hmac) {
  const secret = process.env.SECRET

  calculated_hmac = Base64.stringify(hmacSHA256(JSON.stringify(body), secret))

  return calculated_hmac === hmac
}
