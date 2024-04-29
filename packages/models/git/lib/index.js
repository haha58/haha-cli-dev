'use strict';
//simple-git 是一个轻量级的Node.js库，提供了一系列简化的API，用于操作Git命令。
const SimpleGit = require('simple-git');
const path = require('path');
const userHome = require('user-home');
const log = require('@haha-cli-dev/log');
const inquirer = require('inquirer');
const { readFile, writeFile } = require('@haha-cli-dev/utils');
const fse = require('fs-extra');
const Github = require('./Github');
const Gitee = require('./Gitee');

const DEFAULT_CLI_HOME = '.imooc-cli-dev';
const GIT_SERVER_FILE = '.git_server'; //缓存文件
const GIT_ROOT_DIR = '.git'; //文件根目录
const GITHUB = 'Github';
const GITEE = 'Gitee';
const GIT_SERVER_TYPE = [
  {
    name: 'Github',
    value: GITHUB,
  },
  {
    name: 'Gitee',
    value: GITEE,
  },
];
class Git {
  constructor({ name, version, dir }, { refreshServer = false }) {
    this.name = name;
    this.version = version;
    this.dir = dir;
    this.git = SimpleGit(dir);
    this.gitServer = null; //此处需要用户选择
    this.homePath = null; //缓存用户主目录
    this.refreshServer = refreshServer; //强制刷新
  }

  async prepare() {
    this.checkHomePath(); //检查缓存主目录
    this.checkGitServer(); //检查用户远程仓库类型
  }
  async checkHomePath() {
    try {
      if (!this.homePath) {
        if (process.env.CLI_HOME_PATH) {
          this.homePath = process.env.CLI_HOME_PATH;
        } else {
          this.homePath = path.resolve(userHome, DEFAULT_CLI_HOME);
        }
        log.verbose('this.homePath', this.homePath);
        await fse.ensureDirSync(this.homePath);
        if (!(await fse.existsSync(this.homePath))) {
          throw new Error('用户主目录获取失败');
        }
      }
    } catch (error) {
      log.error(error.message);
    }
  }

  async checkGitServer() {
    try {
      const gitServerPath = this.createPath(GIT_SERVER_FILE);
      console.log('gitServerPath', gitServerPath);
      let gitServer = readFile(gitServerPath);
      console.log('gitServer', gitServer);
      if (!gitServer || this.refreshServer) {
        gitServer = (
          await inquirer.prompt({
            type: 'list',
            message: '请选择您想要托管的Git平台',
            name: 'gitServer',
            default: GITHUB,
            choices: GIT_SERVER_TYPE,
          })
        ).gitServer;
        console.log('gitServer', gitServer);
        writeFile(gitServerPath, gitServer);
        log.success('git server写入成功', `${gitServer} ---> ${gitServerPath}`);
      } else {
        log.success('git server获取成功', gitServer);
      }
      this.gitServer = this.createGitServer(gitServer);
      console.log('this.gitServer', this.gitServer);
      if (!this.gitServer) {
        throw new Error('GitServer 初始化失败');
      }
    } catch (error) {
      log.error(error.message);
    }
  }

  createGitServer(gitServer) {
    if (gitServer === GITHUB) {
      return new Github();
    } else if (gitServer === GITEE) {
      return new Gitee();
    }
    return null;
  }

  createPath(file) {
    const rootDir = path.resolve(this.homePath, GIT_ROOT_DIR);
    const filePath = path.resolve(rootDir, file);
    fse.ensureDirSync(rootDir);
    return filePath;
  }
  init() {}
}

module.exports = Git;
