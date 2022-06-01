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
// Make sure to parse the body as text before it gets parsed to JSON
// as it needs to be in that format for the hmac to work correctly
// Increased default limit, to make sure we can handle large payloads
app.use(bodyParser.text({ type: 'application/json', limit: '50mb' }));

const port = process.env.PORT || 3003

app.post('/', (req, res) => {
  let t0 = Date.now()
  const raw_body = req.body
  const body =  JSON.parse(raw_body)
  const hmac = req.headers['x-hmac-sha256']
  var output = {}

  if(!hmac) {
    console.log('missing hmac')
    res.status(422).json('missing hmac')
    return
  }

  if(!authenticate(raw_body, hmac)) {
    console.log('wrong hmac')
    res.status(401).json('wrong hmac')
    return
  }

  const data = body.data
  const template = body.template

  try {
    const h_template = Handlebars.compile(template)
    output = {
      rendered: h_template(data)
    }
  } catch (e) {
    console.log(e.toString())
    error = e.toString().replace(/\n/gi, '<br>')
    output = {
      error: error
    }
  }
  console.log(`${data.quiz_id} - [${Date.now() - t0} ms]`)

  res.send(output)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

function authenticate(raw_body, hmac) {
  const secret = process.env.SECRET

  calculated_hmac = Base64.stringify(hmacSHA256(raw_body, secret))

  return calculated_hmac === hmac
}
