'use strict'

require('dotenv').config()

const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const compression = require('compression')

const gitController = require('./controllers/gitController')

const app = express()
const port = process.env.PORT || 3000

const server = app.listen(port, () => {
  console.log('Server listening on port ' + port)
})

const ws = require('socket.io')
const io = ws(server)
// send issues to client on initial websocket connect
io.on('connection', socket => {
  getAndSendIssues(socket)
})

app.use(helmet())

app.use(express.static(path.join(__dirname, '/public')))
app.use(compression())

const getAndSendIssues = async socket => {
  const issues = await gitController.getIssues()
  socket.emit('issues', { repo: process.env.GIT_REPO, issues: issues })
}

// use body parser middle ware to validate hook origin
app.use(bodyParser.urlencoded({ verify: gitController.validateHookOrigin, extended: true }))

// 404 page not found or non-erroneous web hook request
app.use((req, res, next) => {
  if (gitController.isHookRequest(req)) {
    res.sendStatus(200) // send ok response to github
    next()
  } else {
    res.sendFile(path.join(__dirname, 'public', 'error', '404.html'))
  }
})

// 500 server error or hook validation failed
app.use((err, req, res, next) => {
  if (gitController.isHookRequest(req)) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(err.message)
    }
    res.sendStatus(400) // validation failed - send bad request response to github
  } else {
    console.error(err.message)
    res.sendFile(path.join(__dirname, 'public', 'error', '500.html'))
  }
})

app.post('/issuehook', (req, res) => {
  getAndSendIssues(io)
})

// create webhook on github (if it doesn't already exist)
gitController.createIssueHook()
