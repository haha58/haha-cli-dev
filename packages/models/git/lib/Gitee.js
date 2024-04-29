const GitServer = require('./GitServer');

class Gitee extends GitServer{
  constructor(){
    super('gitee')
  }

  getSSHKeyUrl(){
    return 'https://gitee.com/profile/sshkeys'
  }

  getTokenHelpUrl(){
    return 'https://gitee.com/help/articles/4191'
  }
}

module.exports=Gitee