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
    return this.request.get(`/users/orgs`,{
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
    })
   }

  createOrgRepo(){

   }

  getTokenUrl(){
    return 'https://github.com/settings/tokens'
  }

  getTokenHelpUrl(){
    return 'https://docs.github.com/en/authentication/connecting-to-github-with-ssh'
  }
}

module.exports=Github