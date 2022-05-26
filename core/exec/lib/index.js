'use strict'

const packages = require('@haha-cli-dev/packages')
const log = require('@haha-cli-dev/log')

const SETTINGS = {
  init: '@haha-cli-dev/init'
}

function exec() {
  const targetPath = process.env.CLI_TARGET_PATH
  const storePath = process.env.CLI_HOME
  const cmdObj = arguments[arguments.length - 1]
  const packageName = SETTINGS[cmdObj._name]
  const _packages = new packages({
    targetPath,
    storePath,
    packageName,
    packageVersion: 'latest'
  })

  //没有打印 w问题 ！！！
  log.verbose(targetPath)
  log.verbose(11)
  log.verbose(process.env.CLI_HOME)

  //1、targetPath ->modulePath(通过targetPath 拿到实际的modulePath)
  //2、modulePath ->Package(npm模块) 将modulePath生成一个通用的package
  //3、Package.getRootFIle(获取入口文件)  这样以后扩展直接处理package的逻辑就可以，而不需要将getRootFIle暴露在外面

  //封装--->复用
}

module.exports = exec
