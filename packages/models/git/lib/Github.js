const GitServer = require('./GitServer');

class Github extends GitServer{
  constructor(){
    super('github')
  }

  getSSHKeyUrl(){
    return 'https://github.com/settings/keys'
  }

  getTokenHelpUrl(){
    return 'https://docs.github.com/en/authentication/connecting-to-github-with-ssh'
  }
}

module.exports=Github