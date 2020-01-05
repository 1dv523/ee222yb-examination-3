'use strict'

require('dotenv').config()

const github = require('octonode')
const express = require('express')
const ws = require('socket.io')
const path = require('path')
const crypto = require('crypto')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const morgan = require('morgan')

const app = express()
const port = process.env.PORT || 3000

const org = '1dv523'
const repo = 'ee222yb-examination-3'
const client = github.client(process.env.GIT_TOKEN)
const ghrepo = client.repo(org + '/' + repo)

const server = app.listen(port, () => {
  console.log('Server listening on port ' + port)
})

app.use(helmet())
app.use(morgan('tiny'))

const io = ws(server)
// send issues to client on initial websocket connect
io.on('connection', socket => {
  getAndSendIssues(socket)
})

app.use(express.static(path.join(__dirname, '/public')))

/* ***************************************************** */
/* TODO eventuellt extrahera hook-del till extern modul */
const validateHookOrigin = (req, res, buf, encoding) => {
  const hmac = crypto.createHmac('sha1', process.env.GIT_SECRET)
  hmac.update(buf, 'utf-8')
  const expectedSignature = 'sha1=' + hmac.digest('hex')

  if (req.headers['x-hub-signature'] !== expectedSignature) {
    throw new Error('Received invalid signature')
  }
}

const isHookRequest = req => {
  return req.headers['x-hub-signature'] !== undefined
}

// use body parser middle ware to validate hook origin
app.use(bodyParser.urlencoded({ verify: validateHookOrigin, extended: true }))

// 404 page not found or non erroneous web hook request
app.use((req, res, next) => {
  if (isHookRequest(req)) {
    res.status(200).send()
    next()
  } else {
    // TODO visa bättre 404-sida
    res.sendStatus(404)
  }
})

// 500 server error or hook validation failed
app.use((err, req, res, next) => {
  if (isHookRequest(req)) {
    console.error(err.message)
    res.sendStatus(400)
  } else {
    // TODO visa bättre 500-sida
    res.sendStatus(500)
  }
})

// handle received data from hook
app.post('/issuehook', (req, res) => {
  console.log('Received response from web hook')

  getAndSendIssues(io)
})

// create webhook on github (if it doesn't already exist)
ghrepo.hook({
  name: 'web',
  active: true,
  events: ['issues', 'issue_comment'],
  config: {
    secret: process.env.GIT_SECRET,
    url: process.env.NODE_ENV === 'production'
      ? 'https://cscloud689.lnu.se/issuehook' // production server
      : 'https://42d7477f.ngrok.io/issuehook' // used during local development
  }
}, () => console.log('Registered web hook'))

const getAndSendIssues = socket => {
  client.get('/repos/' + org + '/' + repo + '/issues', { state: 'all' }, (err, status, body, headers) => {
    if (err) {
      console.error('ERROR', err.statusCode, err.message)
    }
    socket.emit('issues', { repo: repo, issues: body })
  })
}

/*
const getComments = (socket, issueNr) => {
  client.get('/repos/' + org + '/' + repo + '/issues/' + issueNr + '/comments', {}, (err, status, body, headers) => {
    if (err) {
      console.error(err)
    }
    socket.emit('comments', { comments: body })
  })
}
*/
