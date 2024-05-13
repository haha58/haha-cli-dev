const GitServer = require('./GitServer');
const GiteeRequest = require('./GiteeRequest')

class Gitee extends GitServer {
  constructor() {
    super('gitee')
    this.request = null
  }

  setToken(token) {
    super.setToken(token)
    this.request = new GiteeRequest(token)
  }

  //获取用户的信息
  getUser() {
    return this.request.get('/user')
  }

  getOrg(username) {
    return this.request.get(`/users/${username}/orgs`, {
      page: 1,
      per_page: 100
    })
  }

  getRepo(login, repoName) {
    //https://gitee.com/api/v5/repos/{owner}/{repo}
    return this.request.get(`/repos/${login}/${repoName}`).then((response) => {
      return this.handleResponse(response)
    })
  }

  createRepo(repoName) {
    return this.request.post('/user/repos', {
      name: repoName
    }).then((response) => {
      return this.handleResponse(response)
    })
  }

  createOrgRepo(repoName, login) {
    return this.request.post(`/orgs/${login}/repos`, {
      name: repoName
    })
  }

  getTokenUrl() {
    return 'https://gitee.com/profile/personal_access_tokens'
  }

  getTokenHelpUrl() {
    return 'https://gitee.com/help/articles/4191'
  }

  getRemote(login,repoName){
    //https://gitee.com/haha58/haha-cli-dev_publish.git
    return `git@gitee.com:${login}/${repoName}.git`
  }
}

module.exports = Gitee