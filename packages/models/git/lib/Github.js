const GitServer = require('./GitServer');
const GithubRequest=require('./GithubRequest')

class Github extends GitServer{
  constructor(){
    super('github')
  }

  setToken(token){
    super.setToken(token)
    this.request=new GithubRequest(token)
  }

  //获取用户的信息
  getUser(){
    return this.request.get('/user')
  }

  getOrg(){
    return this.request.get(`/user/orgs`,{
      page:1,
      per_page:100
    })
  }

  getRepo(login,repoName){
    return this.request.get(`/repos/${login}/${repoName}`).then((response)=>{
     return this.handleResponse(response)
    })
  }

  createRepo(repoName){
    return this.request.post('/user/repos',{
      name:repoName
    },{
      Accept:'application/vnd.github.v3+json'
    })
   }

  createOrgRepo(repoName,login){
    return this.request.post(`/orgs/${login}/repos`,{
      name:repoName
    },{
      //github 推荐添加
      Accept:'application/vnd.github.v3+json'
    })
   }

  getTokenUrl(){
    return 'https://github.com/settings/tokens'
  }

  getTokenHelpUrl(){
    return 'https://docs.github.com/en/rest?apiVersion=2022-11-28'
  }

  getRemote(login,repoName){
    //https://gitee.com/haha58/haha-cli-dev_publish.git
    return `git@github.com:${login}/${repoName}.git`
  }
}

module.exports=Github