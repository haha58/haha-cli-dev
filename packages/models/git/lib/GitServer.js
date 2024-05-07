function error(methodName){
  throw new Error(`${methodName} must be implemented`)
}

class GitServer{
  constructor(type,token) {
    this.type=type;
    this.token=token
  }

  //创建远程仓库
  createRepo(){
    error("createRepo")
  }

   //创建组织远程仓库
   createOrgRepo(){
    error("createOrgRepo")
  }

  getRemote(){
    error("getRemote")
  }

  getUser(){
    error("getUser")
  }

  getOrg(){
    error("getOrg")
  }

  getSSHKeyUrl(){
    error("getSSHKeyUrl")
  }

  getTokenHelpUrl(){
    error("getTokenHelpUrl")
  }

  setToken(token){
    this.token=token
  }
}

module.exports=GitServer