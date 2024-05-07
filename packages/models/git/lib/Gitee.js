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

  getSSHKeyUrl(){
    return 'https://gitee.com/profile/personal_access_tokens'
  }

  getTokenHelpUrl(){
    return 'https://gitee.com/profile/personal_access_tokens'
  }
}

module.exports=Gitee