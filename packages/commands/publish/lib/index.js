'use strict';

const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const Command = require('@haha-cli-dev/command');
const log = require('@haha-cli-dev/log');
const Git = require('@haha-cli-dev/git');
const {formatString} = require('@haha-cli-dev/utils');
class publishCommand extends Command {
  //Command中一定要实现init、exec两个方法
  //主要是参数进行处理
  init() {
    this.options = {
      refreshServer: this._argv[0].refreshServer,
      refreshToken: this._argv[0].refreshToken,
      refreshOwner:this._argv[0].refreshOwner,
    };
  }
  //执行环境，进行逻辑处理，在trycatch中  --debbug 进行调试
  async exec() {
    try {
      const startTime = new Date().getTime();
      const endTime = new Date().getTime();
      //1.预检查
      this.prepare();
      //2.git FLow自动化
      const git = new Git(this.projectInfo, this.options); //创建Git实例
      await git.prepare();//自动化提交准备和代码仓库初始化
      await git.commit() //代码自动化提交
      console.log('tast')
      //3.云构建与云发布
      log.info(
        '本次发布耗时：',
        Math.floor((endTime - startTime) / 1000) + '秒'
      );
    } catch (error) {
      log.error(error?.message);
      if (process.env.LOG_LEVEL === 'verbose') {
        console.log('error', error);
      }
    }
  }

  prepare() {
    //1.确认项目是否为npm项目
    const projectPath = process.cwd();
    const pkgPath = path.resolve(projectPath, 'package.json');
    log.verbose('package.json', pkgPath);
    if (!fs.existsSync(pkgPath)) {
      throw new Error('package.json不存在');
    }
    //2.确认是否包含name、version、build命令
    const pkg = fse.readJSONSync(pkgPath);
    const { name, version, main } = pkg;
    if (!name || !version || !main) {
      throw new Error(
        'package.json信息不全，请检查是否存在name、version和main'
      );
    }
    let _name=formatString(name)
    this.projectInfo = { name:_name, version, dir: projectPath };
  }
}

function init(argv) {
  return new publishCommand(argv);
}

module.exports = init;
module.exports.publishCommand = publishCommand;
