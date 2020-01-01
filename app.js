'use strict'

// if (process.env.NOVE_ENV !== 'production') {
require('dotenv').config()
// }

const github = require('octonode')
// const gitWebHook = require('express-github-webhook')
// const webhookHandler = require('express-github-webhook')({ path: '/webhook', secret: 'process.env.GIT_TOKEN' })
const express = require('express')
const ws = require('socket.io')
const path = require('path')
const crypto = require('crypto')

const app = express()

const server = app.listen(process.env.PORT, () => {
  console.log('Server listening on port ' + process.env.PORT)
})

const io = ws(server)

app.use(express.static(path.join(__dirname, '/public')))

const org = '1dv523'
const repo = 'ee222yb-examination-3'

const client = github.client(process.env.GIT_TOKEN)
const ghrepo = client.repo(org + '/' + repo)

// create hook to github
ghrepo.hook({
  name: 'web',
  active: true,
  events: ['issues', 'issue_comment'],
  config: {
    secret: process.env.GIT_TOKEN,
    url: 'http://87ced3b5.ngrok.io/issuehook'
  }
}, () => console.log('Registered web hook'))

// receive data from hook
app.post('/issuehook', req => {
  console.log()
  console.log('received hook response')
  // TODO kontrollera x-hub-signature

  const secret = req.headers['x-hub-signature']
  console.log(secret)
  const hex = crypto.createHmac('sha1', process.env.GIT_TOKEN)
  console.log(hex)

  getAndSendIssues(io)
})

// send issues to client on initial websocket connect
io.on('connection', socket => {
  getAndSendIssues(socket)
})

const getAndSendIssues = socket => {
  client.get('/repos/' + org + '/' + repo + '/issues', { state: 'all' }, (err, status, body, headers) => {
    if (err) {
      // TODO server error
      // console.error(err)
    }
    socket.emit('issues', { repo: repo, issues: body })
  })
}

const getComments = (socket, issueNr) => {
  client.get('/repos/' + org + '/' + repo + '/issues/' + issueNr + '/comments', {}, (err, status, body, headers) => {
    if (err) {
      // TODO server error
      console.error(err)
    }
    console.log(body)
    socket.emit('comments', { comments: body })
  })
}
