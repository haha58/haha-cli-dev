function error(methodName){
  throw new Error(`${methodName} must be implemented`)
}

class GitServer{
  constructor(type,token) {
    this.type=type;
    this.token=token
  }

  //创建远程仓库
  createRepo(repoName){
    error("createRepo")
  }

   //创建组织远程仓库
   createOrgRepo(repoName,login){
    error("createOrgRepo")
  }

  getRemote(login,repoName){
    error("getRemote")
  }

  getUser(){
    error("getUser")
  }

  getOrg(){
    error("getOrg")
  }

  isHttpResponse=(response)=>{
    return response&&response.status&&Number.isInteger(response.status)
  }

  handleResponse=(response)=>{
    if(this.isHttpResponse(response)&&response!==200){
      return null
    }else{
      return response
    }
  }


  /**
   * 获取远程仓库的信息
   * @param {*} login  当前登录名称
   * @param {*} repoName 远程仓库名称
   */
  getRepo(login,repoName){
    error("getRepo")
  }
  
  getTokenUrl(){
    error("getTokenUrl")
  }

  getTokenHelpUrl(){
    error("getTokenHelpUrl")
  }

  setToken(token){
    this.token=token
  }
}

module.exports=GitServer