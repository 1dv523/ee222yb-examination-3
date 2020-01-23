const github = require('octonode')
const crypto = require('crypto')

const client = github.client(process.env.GIT_TOKEN)
const ghrepo = client.repo(process.env.GIT_ORG + '/' + process.env.GIT_REPO)

const controller = {}

controller.getIssues = async () => {
  return new Promise((resolve, reject) => {
    client.get('/repos/' + process.env.GIT_ORG + '/' + process.env.GIT_REPO + '/issues', { state: 'all' }, (err, status, body, headers) => {
      if (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('ERROR', err.statusCode, err.message)
        }
        reject(err)
      }
      resolve(body)
    })
  })
}

controller.createIssueHook = () => {
  ghrepo.hook({
    name: 'web',
    active: true,
    events: ['issues', 'issue_comment'],
    config: {
      secret: process.env.GIT_SECRET,
      url: process.env.SITE_URL + '/issuehook'
    }
  }, () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Registered web hook')
    }
  })
}

controller.validateHookOrigin = (req, res, buf, encoding) => {
  const hmac = crypto.createHmac('sha1', process.env.GIT_SECRET)
  hmac.update(buf, 'utf-8')
  const expectedSignature = 'sha1=' + hmac.digest('hex')

  if (req.headers['x-hub-signature'] !== expectedSignature) {
    throw new Error('Received invalid signature')
  }
}

controller.isHookRequest = req => {
  return req.headers['x-hub-signature'] !== undefined
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

module.exports = controller
