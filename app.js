'use strict'

const github = require('octonode')
const express = require('express')
const ws = require('socket.io')
const path = require('path')

const app = express()
const port = 8000

const server = app.listen(port, () => {
  console.log('Server listening on port ' + port)
})

const io = ws(server)

app.use(express.static(path.join(__dirname, '/public')))

const gitCredentials = require('./credentials/git-token.json')
const client = github.client(gitCredentials.token)
const org = '1dv523'
const repo = 'ee222yb-examination-3'

const ghrepo = client.repo(org + '/' + repo)

// create hook to github
ghrepo.hook({
  name: 'web',
  active: true,
  events: ['issues', 'issue_comment'],
  config: {
    url: 'https://18c12bd2.ngrok.io/payload'
  }
}, () => console.log('Registered web hook'))

// receive data from hook
app.post('/payload', (req, res) => {
  console.log('received event')
  getIssues(io)
})

// send issues to client on initial websocket connect
io.on('connection', async socket => {
  getIssues(socket)
})

const getIssues = socket => {
  client.get('/repos/' + org + '/' + repo + '/issues', { state: 'all' }, (err, status, body, headers) => {
    if (err) {
      // TODO server error
      console.error(err)
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
