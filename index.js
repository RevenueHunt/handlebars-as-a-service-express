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
app.use(bodyParser.text({ type: 'application/json' }));

const port = process.env.PORT || 3003

app.post('/', (req, res) => {
  const raw_body = req.body
  const body =  JSON.parse(raw_body)
  const hmac = req.headers['x-hmac-sha256']
  var rendered = ''
  var error = ''

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
  console.log(data.quiz_id)
  const template = body.template

  try {
    const h_template = Handlebars.compile(template)
    rendered = h_template(data)

    res.send({
      rendered: rendered
    })
  } catch (e) {
    error = e.toString().replace(/\n/gi, '<br>')

    res.send({
      error: error
    })
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

function authenticate(raw_body, hmac) {
  const secret = process.env.SECRET

  calculated_hmac = Base64.stringify(hmacSHA256(raw_body, secret))

  return calculated_hmac === hmac
}
