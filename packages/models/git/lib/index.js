'use strict';
//simple-git 是一个轻量级的Node.js库，提供了一系列简化的API，用于操作Git命令。
const SimpleGit = require('simple-git');
const path = require('path');
const userHome = require('user-home');
const log = require('@haha-cli-dev/log');
const inquirer = require('inquirer');
const { readFile, writeFile, spinnerStart } = require('@haha-cli-dev/utils');
const fse = require('fs-extra');
const terminalLink = require('terminal-link'); //在终端生成链接
const Github = require('./Github');
const Gitee = require('./Gitee');

const DEFAULT_CLI_HOME = '.imooc-cli-dev';
const GIT_SERVER_FILE = '.git_server'; //缓存文件
const GIT_ROOT_DIR = '.git'; //文件根目录
const GIT_TOKEN_FILE = '.git_token'; //token缓存文件
const GIT_OWN_FILE = '.git_own'; //当前用户选择那种仓库类型
const GIT_LOGIN_FILE = '.git_login'; //当前用户登录名

const GITHUB = 'Github';
const GITEE = 'Gitee';
const REPO_OWNER_USER = 'user';
const REPO_OWNER_ORG = 'org';

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
const GIT_OWNER_TYPE = [
  {
    name: '个人',
    value: REPO_OWNER_USER,
  },
  {
    name: '组织',
    value: REPO_OWNER_ORG,
  },
];
const GIT_OWNER_TYPE_ONLY = [
  {
    name: '个人',
    value: REPO_OWNER_USER,
  },
];

class Git {
  constructor(
    { name, version, dir },
    { refreshServer = false, refreshToken = false, refreshOwner = false }
  ) {
    this.name = name;  //项目名称
    this.version = version;   //项目版本
    this.dir = dir;  //源码目录
    this.git = SimpleGit(dir);  //SimpleGit实例
    this.gitServer = null; //gitServer实例
    this.homePath = null; //本地缓存目录
    this.user = null; //用户信息
    this.orgs = null; //用户所属组织仓库
    this.owner = null;//远程仓库类型
    this.login = null;//远程仓库登录名
    this.repo = null;  //远程仓库信息
    this.refreshServer = refreshServer; //强制刷新远程仓库类型
    this.refreshToken = refreshToken; //强制刷新远程仓库token
    this.refreshOwner = refreshOwner; //强制刷新远程仓库类型
  }

  async prepare() {
    await this.checkHomePath(); //检查缓存主目录
    await this.checkGitServer(); //检查用户远程仓库类型
    await this.checkGitToken(); //生成远程仓库token
    await this.getUserAndOrgs(); //获取远程仓库用户和组织信息（因为这个库可能在组织下）
    await this.checkGitOwner(); //确认远程仓库类型
    await this.checkRepo();  //检查并创建远程仓库
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
        writeFile(gitServerPath, gitServer);
        log.success('git server写入成功', `${gitServer} ---> ${gitServerPath}`);
      } else {
        log.success('git server获取成功', gitServer);
      }
      this.gitServer = this.createGitServer(gitServer);
      if (!this.gitServer) {
        throw new Error('GitServer 初始化失败');
      }
    } catch (error) {
      log.error(error.message);
    }
  }

  async checkGitToken() {
    try {
      const tokenPath = this.createPath(GIT_TOKEN_FILE);
      let token = readFile(tokenPath);
      if (!token || this.refreshToken || this.refreshServer) {
        log.warn(
          this.gitServer.type + ' token未生成',
          '请先生成' +
          this.gitServer.type +
          ' token, ' +
          terminalLink('链接', this.gitServer?.getTokenUrl())
        );
        token = (
          await inquirer.prompt({
            type: 'password',
            name: 'token',
            message: '请将token复制到这里',
            default: '',
          })
        ).token;
        writeFile(tokenPath, token);
        log.success('token写入成功', `${token} ---> ${tokenPath}`);
      } else {
        log.success('token获取成功', tokenPath);
      }
      this.token = token;
      this.gitServer.setToken(token);
    } catch (error) {
      log.error(error.message);
    }
  }

  async getUserAndOrgs() {
    try {
      this.user = await this.gitServer.getUser();
      log.verbose("user", this.user)
      if (!this.user?.login) {
        throw new Error('用户信息获取失败');
      }
      this.orgs = await this.gitServer.getOrg(this.user.login);
      log.verbose("orgs", this.orgs)
      if (!this.orgs) {
        throw new Error('组织信息获取失败');
      }
      log.success(this.gitServer.type + '用户和组织信息获取成功');
    } catch (error) {
      log.error(error.message);
    }
  }

  async checkGitOwner() {
    try {
      const ownerPath = this.createPath(GIT_OWN_FILE);
      const loginPath = this.createPath(GIT_LOGIN_FILE);
      let owner = readFile(ownerPath);
      let login = readFile(loginPath);
      //因为可能owner选择一半，脚手架停止
      if (!owner || !login || this.refreshServer || this.checkGitToken || this.refreshOwner) {
        owner = (
          await inquirer.prompt({
            type: 'list',
            message: '请选择远程仓库类型',
            name: 'owner',
            default: REPO_OWNER_USER,
            choices: this.orgs.length > 0 ? GIT_OWNER_TYPE : GIT_OWNER_TYPE_ONLY,
          })
        ).owner;
        if (owner === REPO_OWNER_USER) {
          login = this.user.login
        } else {
          login = (await inquirer.prompt({
            type: 'list',
            message: '请选择',
            name: 'login',
            choices: this.orgs.map(item => ({
              name: item.login,
              value: item.login
            }))
          })).login
        }
        writeFile(ownerPath, owner)
        writeFile(loginPath, login)
        log.success('owner写入成功', `${owner} ---> ${ownerPath}`);
        log.success('login写入成功', `${login} ---> ${loginPath}`);
      } else {
        log.success('owner获取成功', owner);
        log.success('login获取成功', login);
      }
      this.owner = owner;
      this.login = login;
    } catch (error) {
      log.error('checkGitOwner', error.message)
    }
  }

  async checkRepo() {
    try {
      let repo = await this.gitServer.getRepo(this.login, this.name)
      if (!repo) {
        let spinner = spinnerStart('开始创建远程仓库')
        try {
          if (this.owner === REPO_OWNER_USER) {
            repo = await this.gitServer.createRepo(this.name)
          } else {
            this.gitServer.createOrgRepo(this.name, this.login)
          }
        } catch (error) {
          log.error(error)
        } finally {
          spinner.stop(true)
        }
        if (repo) {
          log.success('远程仓库创建成功')
        } else {
          throw new Error('远程仓库创建失败 请检查传参（https://gitee.com/api/v5/swagger#/postV5UserRepos）',)
        }
      } else {
        log.success('远程仓库获取成功')
      }
      this.repo = repo
      log.verbose('repo', repo)
    } catch (error) {
      log.error('checkRepo', error)
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

  init() { }
}

module.exports = Git;
