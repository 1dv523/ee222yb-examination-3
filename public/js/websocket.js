import * as issues from './issues.js'
const socket = window.io()

// server sent issues
socket.on('issues', data => {
  issues.setData(data)
})
