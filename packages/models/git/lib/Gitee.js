const GitServer = require('./GitServer');
const GiteeRequest=require('./GiteeRequest')

class Gitee extends GitServer{
  constructor(){
    super('gitee')
    this.request=null
  }

  setToken(token){
    super.setToken(token)
    this.request=new GiteeRequest(token)
  }

  //获取用户的信息
  getUser(){
    return this.request.get('/user')
  }

  getOrg(username){
    return this.request.get(`/users/${username}/orgs`,{
      page:1,
      per_page:100
    })
  }

  getRepo(login,repoName){
    //https://gitee.com/api/v5/repos/{owner}/{repo}
    return this.request.get(`/repos/${login}/${repoName}`).then((response)=>{
     return this.handleResponse(response)
    })
  }

  async createRepo(repoName){
    return this.request.post('/user/repos',{
      name:repoName
    }).then((response)=>{
      return this.handleResponse(response)
     })
   }

   async createOrgRepo(){

   }

  getTokenUrl(){
    return 'https://gitee.com/profile/personal_access_tokens'
  }

  getTokenHelpUrl(){
    return 'https://gitee.com/help/articles/4191'
  }
}

module.exports=Gitee