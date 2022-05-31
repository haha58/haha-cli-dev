'use strict'
const semver = require('semver')
const colors = require('colors')

const LOWEST_NODE_VERSION = '12.0.0'

class Command {
  constructor(argv) {
    if (!argv || argv.length === 0 || !argv[0]) {
      throw new Error('参数不能为空')
    }
    if (!Array.isArray(argv)) {
      throw new Error('参数必须是数组')
    }

    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve()
      chain = chain
        .then(() => this.checkNodeVersion())
        .then(() => this.checkArgs(argv))
        .then(() => this.init())
        .then(() => this.exec())
        .catch(error => console.log(error.message))
    })
  }

  //检查node版本
  checkNodeVersion() {
    const currentVersion = process.version
    if (!semver.gte(currentVersion, LOWEST_NODE_VERSION)) {
      throw new Error(colors.red('错误:node版本过低'))
    }
  }

  //初始化参数
  checkArgs(argv) {
    this._argv = argv.slice(0, argv.length - 1)
  }

  init() {
    throw new Error('command 必须拥有一个 init 方法')
  }

  exec() {
    throw new Error('command 必须拥有一个 exec 方法')
  }
}

module.exports = Command
