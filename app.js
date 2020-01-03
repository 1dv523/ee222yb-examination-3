'use strict'

require('dotenv').config()

const github = require('octonode')
const express = require('express')
const ws = require('socket.io')
const path = require('path')
const crypto = require('crypto')
const bodyParser = require('body-parser')

const app = express()
const port = process.env.PORT || 8000

const org = '1dv523'
const repo = 'ee222yb-examination-3'
const client = github.client(process.env.GIT_TOKEN)
const ghrepo = client.repo(org + '/' + repo)

const server = app.listen(port, () => {
  console.log('Server listening on port ' + port)
})

const io = ws(server)
// send issues to client on initial websocket connect
io.on('connection', socket => {
  getAndSendIssues(socket)
})

app.use(express.static(path.join(__dirname, '/public')))

/* ***************************************************** */
/* TODO eventuellt extrahera denna del till extern modul */
const validateHookOrigin = (req, res, buf, encoding) => {
  // console.log('validating web hook...')

  const hmac = crypto.createHmac('sha1', process.env.GIT_SECRET)
  hmac.update(buf, 'utf-8')
  const expectedSignature = 'sha1=' + hmac.digest('hex')

  if (req.headers['x-hub-signature'] !== expectedSignature) {
    throw new Error('Received invalid signature')
  }
  // } else {
  //   console.log('Valid signature!')
  // }
}

// use body parser middle ware to validate hook origin
app.use(bodyParser.urlencoded({ verify: validateHookOrigin, extended: true }))
// app.use(bodyParser.json({ verify: validateHookOrigin }))

// abort hook handling on error (ORDER IMPORTANT)
app.use((err, req, res, next) => {
  if (!err) {
    next()
  } else {
    console.log(err)
  }
})

// handle received data from hook
app.post('/issuehook', (req, res) => {
  console.log('received response from web hook')

  getAndSendIssues(io)
})

/* ****************** */
/* ****************** */

// create/overwrite webhook on github
ghrepo.hook({
  name: 'web',
  active: true,
  events: ['issues', 'issue_comment'],
  config: {
    secret: process.env.GIT_SECRET,
    url: 'http://5a3079b9.ngrok.io/issuehook'
  }
}, () => console.log('Registered web hook'))

const getAndSendIssues = socket => {
  client.get('/repos/' + org + '/' + repo + '/issues', { state: 'all' }, (err, status, body, headers) => {
    if (err) {
      // TODO error
      console.error('ERROR', err.statusCode, err.message)
    }
    socket.emit('issues', { repo: repo, issues: body })
  })
}

const getComments = (socket, issueNr) => {
  client.get('/repos/' + org + '/' + repo + '/issues/' + issueNr + '/comments', {}, (err, status, body, headers) => {
    if (err) {
      // TODO error
      console.error(err)
    }
    console.log(body)
    socket.emit('comments', { comments: body })
  })
}
