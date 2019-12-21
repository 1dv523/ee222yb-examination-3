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

// socket.emit skickar endast till samma klient som skickade
//   kan vara bra om man inte vill skicka samma meddelande till just den klienten som till de andra
// socket.broadcast skickar till alla anslutna klienter, förutom den klienten som skickade meddelandet
// io.emit skickar till ALLA inkl. klienten som skickade.
//   bör användas för att visa de flesta meddelanden så att klienten som skickar får verifierat att dennes meddelanden kommit fram

// github
const gitCredentials = require('./credentials/git-token.json')
const client = github.client(gitCredentials.token)
let issues
const org = '1dv523'
const repo = 'ee222yb-examination-3'

client.get('/repos/' + org + '/' + repo + '/issues', {}, (req, status, body, headers) => { // TODO hämtar bara öppna issues verkar det som
  // console.log(body)
  issues = body
})

io.on('connection', socket => {
  socket.emit('firstIssues', { repo: repo, issues: issues })

  socket.on('', data => {
    console.log('ws connection')
    // io.emit('', { data: data.data })
  })
})
