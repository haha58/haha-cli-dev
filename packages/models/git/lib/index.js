'use strict';
//simple-git 是一个轻量级的Node.js库，提供了一系列简化的API，用于操作Git命令。
const SimpleGit = require('simple-git');
const path = require('path');
const userHome = require('user-home');
const log = require('@haha-cli-dev/log');
const CloudBuild = require('@haha-cli-dev/cloudbuild');
const inquirer = require('inquirer');
const { readFile, writeFile, spinnerStart } = require('@haha-cli-dev/utils');
const fse = require('fs-extra');
const terminalLink = require('terminal-link'); //在终端生成链接
const semver = require('semver');
const Github = require('./Github');
const Gitee = require('./Gitee');

const DEFAULT_CLI_HOME = '.imooc-cli-dev';
const GIT_SERVER_FILE = '.git_server'; //缓存文件
const GIT_ROOT_DIR = '.git'; //文件根目录
const GIT_TOKEN_FILE = '.git_token'; //token缓存文件
const GIT_OWN_FILE = '.git_own'; //当前用户选择那种仓库类型
const GIT_LOGIN_FILE = '.git_login'; //当前用户登录名
const GIT_IGNORE_FILE = '.gitignore'; //.gitignore文件

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

const VERSION_RELEASE = 'release'; //线上发布分支
const VERSION_DEV = 'dev'; //线上开发分支
class Git {
  constructor(
    { name, version, dir },
    { refreshServer = false, refreshToken = false, refreshOwner = false,buildCmd='' }
  ) {
    this.name = name; //项目名称
    this.version = version; //项目版本
    this.dir = dir; //源码目录
    this.git = SimpleGit(dir); //SimpleGit实例
    this.gitServer = null; //gitServer实例
    this.homePath = null; //本地缓存目录
    this.user = null; //用户信息
    this.orgs = null; //用户所属组织仓库
    this.owner = null; //远程仓库类型
    this.login = null; //远程仓库登录名
    this.repo = null; //远程仓库信息
    this.remote = null; //当前仓库的所有远程仓库信息
    this.refreshServer = refreshServer; //强制刷新远程仓库类型
    this.refreshToken = refreshToken; //强制刷新远程仓库token
    this.refreshOwner = refreshOwner; //强制刷新远程仓库类型
    this.branch = null; //本地开发分支
    this.buildCmd=buildCmd //构建命令
  }

  async prepare() {
    await this.checkHomePath(); //检查缓存主目录
    await this.checkGitServer(); //检查用户远程仓库类型
    await this.checkGitToken(); //生成远程仓库token
    await this.getUserAndOrgs(); //获取远程仓库用户和组织信息（因为这个库可能在组织下）
    await this.checkGitOwner(); //确认远程仓库类型
    await this.checkRepo(); //检查并创建远程仓库
    this.checkGitIgnore(); //在远程仓库中，检查GitIgnore文件
    await this.init(); //完成本地仓库初始化
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
      log.verbose('user', this.user);
      if (!this.user?.login) {
        throw new Error('用户信息获取失败');
      }
      this.orgs = await this.gitServer.getOrg(this.user.login);
      log.verbose('orgs', this.orgs);
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
      if (
        !owner ||
        !login ||
        this.refreshServer ||
        this.checkGitToken ||
        this.refreshOwner
      ) {
        owner = (
          await inquirer.prompt({
            type: 'list',
            message: '请选择远程仓库类型',
            name: 'owner',
            default: REPO_OWNER_USER,
            choices:
              this.orgs.length > 0 ? GIT_OWNER_TYPE : GIT_OWNER_TYPE_ONLY,
          })
        ).owner;
        if (owner === REPO_OWNER_USER) {
          login = this.user.login;
        } else {
          login = (
            await inquirer.prompt({
              type: 'list',
              message: '请选择',
              name: 'login',
              choices: this.orgs.map((item) => ({
                name: item.login,
                value: item.login,
              })),
            })
          ).login;
        }
        writeFile(ownerPath, owner);
        writeFile(loginPath, login);
        log.success('owner写入成功', `${owner} ---> ${ownerPath}`);
        log.success('login写入成功', `${login} ---> ${loginPath}`);
      } else {
        log.success('owner获取成功', owner);
        log.success('login获取成功', login);
      }
      this.owner = owner;
      this.login = login;
    } catch (error) {
      log.error('checkGitOwner', error.message);
    }
  }

  async checkRepo() {
    try {
      let repo = await this.gitServer.getRepo(this.login, this.name);
      if (!repo) {
        let spinner = spinnerStart('开始创建远程仓库');
        try {
          if (this.owner === REPO_OWNER_USER) {
            repo = await this.gitServer.createRepo(this.name);
          } else {
            repo = await this.gitServer.createOrgRepo(this.name, this.login);
          }
        } catch (error) {
          log.error(error);
        } finally {
          spinner.stop(true);
        }
        if (repo) {
          log.success('远程仓库创建成功');
        } else {
          let url = '';
          if (this.gitServer.type === GITEE) {
            if (this.owner === REPO_OWNER_USER) {
              url = 'https://gitee.com/api/v5/swagger#/postV5UserRepos';
            } else {
              url = 'https://gitee.com/api/v5/swagger#/postV5OrgsOrgRepos';
            }
          } else {
            url = this.gitServer.getTokenHelpUrl();
          }
          throw new Error(`远程仓库创建失败 请检查传参（${url}）`);
        }
      } else {
        log.success('远程仓库获取成功');
      }
      this.repo = repo;
      log.verbose('repo', repo);
    } catch (error) {
      log.error('checkRepo', error);
    }
  }

  checkGitIgnore() {
    //从远程仓库中目录中获取gitIgnore文件
    const gitIgnore = path.resolve(this.dir, GIT_IGNORE_FILE);
    //不要有空格，否则gitinore文件也会换行
    if (!fse.existsSync(gitIgnore)) {
      writeFile(
        gitIgnore,
        `.DS_Store
node_modules
/dist

#local env files
.env.local
.env.*.local

#Log files
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

#Editor directories and files
.idea
.vscode
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?`
      );
      log.success(`自动写入${GIT_IGNORE_FILE}文件成功`);
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

  async init() {
    if (await this.getRemote()) {
      //获取远程仓库  如果已经完成初始化则返回
      return;
    }
    await this.initAndRemote(); //对本地仓库初始化并与远程仓库绑定
    await this.initCommit(); //初始化提交
  }

  getRemote() {
    const gitPath = path.resolve(this.dir, GIT_ROOT_DIR);
    this.remote = this.gitServer.getRemote(this.login, this.name);
    console.log(this.remote, fse.existsSync(gitPath));
    if (fse.existsSync(gitPath)) {
      log.success('git已完成初始化');
      return true;
    }
  }

  async initAndRemote() {
    log.info('git执行初始化');
    await this.git.init(this.dir);
    log.info('添加git remote');
    const remotes = await this.git.getRemotes();
    log.verbose('git remotes', remotes);
    if (!remotes.find((item) => item.name === 'origin')) {
      await this.git.addRemote('origin', this.remote);
    }
  }

  async initCommit() {
    await this.checkConflicted(); //代码冲突检查
    await this.checkNotCommitted(); //代码未提交检查,自动化提交
    if (await this.checkRemoteMaster()) {
      //检查远程是否有master分支
      await this.pullRemoteRepo('master', {
        '--allow-unrelated-histories': null, //--allow-unrelated-histories将不相关的代码合并,强制的merge
      });
    } else {
      await this.pushRemoteRepo('master');
    }
  }

  async pullRemoteRepo(branchName, options) {
    try {
      log.info(`同步远程${branchName}分支代码`);
      await this.git.pull('origin', branchName, options);
    } catch (error) {
      log.error(error.message);
    }
  }

  async pushRemoteRepo(branchName) {
    log.info(`推送代码至${branchName}分支`);
    await this.git.push('origin', branchName);
    log.success('推送代码成功');
  }

  async checkRemoteMaster() {
    log.info('检查远程master分支是否存在');
    const remotes = await this.git.listRemote(['--refs']);
    return remotes.indexOf('refs/heads/master') >= 0;
  }
  async checkNotCommitted() {
    const status = await this.git.status();
    log.verbose('status', status);
    if (
      status.not_added.length > 0 ||
      status.created.length > 0 ||
      status.deleted.length > 0 ||
      status.modified.length > 0 ||
      status.renamed.length > 0
    ) {
      await this.git.add(status.not_added);
      await this.git.add(status.created);
      await this.git.add(status.deleted);
      await this.git.add(status.modified);
      await this.git.add(status.renamed);
      let message;
      while (!message) {
        message = (
          await inquirer.prompt({
            type: 'text',
            name: 'message',
            message: '请输入commit信息',
          })
        ).message;
      }
      await this.git.commit(message);
      log.success('本次commit提交成功');
    }
  }
  async checkConflicted() {
    try {
      const status = await this.git.status();
      log.info('代码冲突检查');
      console.log('status',status)
      if (status.conflicted.length > 0) {
        throw new Error('当前代码存在冲突，请手动处理合并后再试！');
      }
      log.success('代码冲突检查通过');
    } catch (error) {
      log.error(error.message);
    }
  }

  async commit() {
    try {
      //1.生成开发分支
    await this.getCorrentVersion();
    //2.在开发分支上提交代码
    await this.checkStash();
    //3.检查代码冲突
    await this.checkConflicted();
    //4.切换开发分支
    console.log('this.branch',this.branch)
    await this.checkoutBranch(this.branch)
    //5.合并远程master分支到开发分支代码
    await this.pullRemoteMasterAndBranch()
    //6.将开发分支推送到远程仓库
    await this.pushRemoteRepo(this.branch)
    } catch (error) {
      console.log('err',error.message)
    }
  }

  async pullRemoteMasterAndBranch(){
    log.info(`合并[master]->[${this.branch}]`)
    await this.pullRemoteRepo('master')
    log.success('合并master成功')
    await this.checkConflicted()
    log.info('检查远程开发分支')
    const remoteBranchList=await this.getRemoteBranchList()
    console.log(remoteBranchList)
    if(remoteBranchList.indexOf(this.version)>=0){
      log.info(`合并[${this.branch}]->[${this.branch}]`)
      await this.pullRemoteRepo(this.branch)
      log.success(`合并远程[${this.branch}]成功`)
      await this.checkConflicted()
    }else{
      log.success(`不存在远程开发分支[${this.branch}]`)
    }
  }

  async checkoutBranch(branch){
    const localBranchList=await this.git.branchLocal()
    log.verbose("localBranchList",localBranchList)
    if(localBranchList.all.indexOf(branch)>=0){
      await this.git.checkout(branch)
    }else{
      //相当于 git checkout -b 创建新分支
      await this.git.checkoutLocalBranch(branch)
    }
    log.success(`开发分支切换到${branch}`)
  }
  //2.1检查缓存区
  async checkStash() {
    log.info('检查stash记录');
    const stashList = await this.git.stashList();
    console.log('stashList', stashList);
    if (stashList.all.length > 0) {
      await this.git.stash(['pop']);
      log.success('stash pop成功');
    }
  }

  async getCorrentVersion() {
    //1.获取远程开发分支
    //版本号规范：release/x.y.z(线上分支) dev/x.y.z(本地分支)
    //版本号递增规范：major/minor/patch
    log.info('获取远程代码分支');
    const remoteBranchList = await this.getRemoteBranchList(VERSION_RELEASE);
    let releaseVersion = null;
    if (remoteBranchList && remoteBranchList.length > 0) {
      releaseVersion = remoteBranchList[0];
    }
    log.info('线上最新版本号', releaseVersion);
    //2.生成本地开发分支
    const devVersion = this.version;
    if (!releaseVersion) {
      //最新版本号不存在，生成本地开发分支
      this.branch = `${VERSION_DEV}/${devVersion}`;
    } else if (semver.gt(this.version, releaseVersion)) {
      //本地分支大于远程分支，将获取升级后的版本号写入package.json
      log.info('当前版本大于线上最新版本', `${devVersion}>=${releaseVersion}`);
      this.branch = `${VERSION_DEV}/${devVersion}`;
    } else {
      log.info('当前版本小于线上最新版本', `${devVersion}<=${releaseVersion}`);
      //需要用户选择升级版本号模式
      const incType = (
        await inquirer.prompt({
          type: 'list',
          name: 'incType',
          message: '自动升级版本，请选择升级版本类型',
          default: 'patch',
          choices: [
            {
              //semver.inc(releaseVersion,'patch') 自动计算升级后版本
              name: `补底版本（${releaseVersion} -> ${semver.inc(
                releaseVersion,
                'patch'
              )}）`,
              value: 'patch',
            },
            {
              name: `次要版本（${releaseVersion} -> ${semver.inc(
                releaseVersion,
                'minor'
              )}）`,
              value: 'minor',
            },
            {
              name: `注意版本（${releaseVersion} -> ${semver.inc(
                releaseVersion,
                'major'
              )}）`,
              value: 'major',
            },
          ],
        })
      ).incType;
      const incVersion = semver.inc(releaseVersion, incType);
      this.branch = `${VERSION_DEV}/${incVersion}`;
      this.version = incVersion;
    }
    log.verbose('本地开发分支', this.branch);
    //3.将version同步到package.json
    this.syncVersionToPackageJson();
  }

  syncVersionToPackageJson() {
    const pkg = fse.readJsonSync(`${this.dir}/package.json`);
    if (pkg && pkg.version !== this.version) {
      pkg.version = this.version;
      //{ spaces: 2 }使package.json保持两个空格缩进，否则会变成一行
      fse.writeJSONSync(`${this.dir}/package.json`, pkg, { spaces: 2 });
    }
  }
  async getRemoteBranchList(type) {
    const remotes = await this.git.listRemote(['--refs']);
    console.log('remotes', remotes, remotes.length);
    let reg;
    if (type === VERSION_RELEASE) {
      //refs/tags/release/1.0.0
      reg = /.+?refs\/tags\/release\/(\d+\.\d+\.\d+)/g;
    } else {
         //refs/heads/dev/1.0.0
         reg = /.+?refs\/heads\/dev\/(\d+\.\d+\.\d+)/g;
    }
    return remotes
      .split('\n')
      .map((remote) => {
        const match = reg.exec(remote);
        reg.lastIndex = 0;
        if (match && semver.valid(match[1])) {
          //match是否存在并是一个版本号
          return match[1];
        }
      })
      .filter((_) => _)
      .sort((a, b) => {
        if (semver.lte(b, a)) {
          if (a === b) {
            return 0;
          }
          return -1;
        }
        return 1;
      });
  }

  async publish(){
    await this.preparePublish()
    const cloudBuild=new CloudBuild(this,{
      buildCmd:this.buildCmd
    })
    await cloudBuild.init()  //异步操作，需要返回promise
    await cloudBuild.build() 
  }

  async preparePublish(){
    if(this.buildCmd){
      const buildCmdArr=this.buildCmd.split(" ")
      if(buildCmdArr[0]==='npm'||buildCmdArr[0]==='cnpm'){
        this.buildCmd='npm run build'
      }else{
        throw new Error('Build命令非法，必须使用npm或者cnpm')
      }
    }
  }
}

module.exports = Git;
