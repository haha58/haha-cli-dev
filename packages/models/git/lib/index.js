'use strict';
//simple-git 是一个轻量级的Node.js库，提供了一系列简化的API，用于操作Git命令。
const SimpleGit = require('simple-git');
class Git {
  constructor({ name, version, dir }) {
    this.name = name;
    this.version = version;
    this.dir = dir;
    this.git = SimpleGit(dir);
    this.gitServer = null; //此处需要用户选择
    this.homePath = null; //缓存用户主目录
  }

  async prepare() {
    this.checkHomePath(); //检查缓存主目录
  }
  checkHomePath() {}

  init() {
    console.log('init');
  }
}

module.exports = Git;
