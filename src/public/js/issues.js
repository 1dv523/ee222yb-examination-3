const issueTemplate = document.createElement('template')
issueTemplate.innerHTML = `
  <div class="issue">
    <div class="header"></div>
    <div class="content"></div>
    <div class="properties"></div>
  </div>
`

const issueContainer = document.querySelector('#issueContainer')

// listeners for toggle-buttons
document.querySelector('#toggleAll').addEventListener('click', () => {
  displayIssues(globalData)
})
document.querySelector('#toggleOpen').addEventListener('click', () => {
  displayIssues(globalData, 'open')
})
document.querySelector('#toggleClosed').addEventListener('click', () => {
  displayIssues(globalData, 'closed')
})

let globalData, globalState

export const setData = data => {
  logReceivedIssues()
  globalData = data
  displayIssues(globalData, globalState)
}

const displayIssues = (data, state) => {
  // data.issues = undefined // TODO debug

  document.body.querySelector('h1').textContent = 'Issues of ' + data.repo

  if (!data.issues) {
    issueContainer.textContent = 'Found no issues for this repository'
    return
  }

  const filteredData = toggleState(data, state)

  // remove old issues
  while (issueContainer.lastChild) {
    issueContainer.lastChild.remove()
  }
  // add new issues
  if (filteredData.issues) {
    filteredData.issues.forEach(issue => addIssue(issue))
  }
}

const addIssue = issue => {
  issueContainer.appendChild(issueTemplate.content.cloneNode(true))
  const newIssue = issueContainer.lastElementChild

  newIssue.querySelector('.header').textContent = '#' + issue.number + ' ' + issue.title
  newIssue.querySelector('.content').textContent = issue.body
  const properties = newIssue.querySelector('.properties')
  properties.textContent = 'Created by: ' + issue.user.login + ' at ' + issue.created_at
  properties.textContent += ', ' + issue.comments + ' comments'

  newIssue.classList.add(issue.state)
}

const toggleState = (data, state) => {
  globalState = state
  let toggledStateButton

  if (state === 'open') {
    toggledStateButton = document.querySelector('#toggleOpen')
  } else if (state === 'closed') {
    toggledStateButton = document.querySelector('#toggleClosed')
  } else {
    toggledStateButton = document.querySelector('#toggleAll')
  }
  const prevMarkedButton = document.querySelector('.markedToggleButton')
  if (prevMarkedButton) {
    prevMarkedButton.classList.remove('markedToggleButton')
  }
  toggledStateButton.classList.add('markedToggleButton')

  const filteredData = {}
  filteredData.issues = data.issues.filter(issue => state ? issue.state === state : true)
  return filteredData
}

const logReceivedIssues = () => {
  const date = new Date()
  const timestamp = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()
  let counter = 0
  console.log((++counter) + '. received new issues @' + timestamp)
}
