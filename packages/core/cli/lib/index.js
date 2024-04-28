'use strict'

//外部引入的包放最外面，内部引入的包放里面

const path = require('path')
const userHome = require('user-home')
const pathExists = require('path-exists')
const { program } = require('commander')
const semver = require('semver')
const colors = require('colors')

const log = require('@haha-cli-dev/log')
const exec = require('@haha-cli-dev/exec')

const pkg = require('../package.json')
const constant = require('./const')

function core() {
  try {
    prepare()
    registerCommander()
  } catch (e) {
    console.log(e.message)
    if (process.env.LOG_LEVEL === 'verbose') {
      console.log(e)
    }
  }
}

function prepare() {
  checkPkgVersion()
  checkRoot()
  checkUserHome()
  checkEnv()
  checkGlobalUpdate()
}

function checkPkgVersion() {
  log.success('当前版本:', pkg.version)
}

//检查是否是root用户
function checkRoot() {
  //root-check 检查是否是root账户 并自动降级
  const rootCheck = require('root-check')
  rootCheck()
}

//检查用户主目录
function checkUserHome() {
  // userHome 查询主目录
  //=>C:\Users\haha
  const userHomeExists = pathExists.sync(userHome)
  if (!userHome || !userHomeExists) {
    throw new Error(colors.red('当前登录用户主目录不存在'))
  }
}

function checkEnv() {
  //引入解析环境变量的库
  const dotenv = require('dotenv')
  const dotenvPath = path.resolve(userHome, '.env')
  if (pathExists.sync(dotenvPath)) {
    // 把.env的环境变量放在process.env里
    dotenv.config({ path: dotenvPath })
  }
  //创建默认的环境变量配置
  createDefaultConfig()
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome
  }
  if (process.env.CLI_HOME_PATH) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME_PATH)
  } else {
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome
}

/**
 *  1.获取当前版本号和模块名
    2.调用npm API ,获取所有的版本号
    3.提取所有的版本号,比对哪些版本号是大于当前版本号的
    4.获取最新的版本号,提示用户更新到该版本
 */
async function checkGlobalUpdate() {
  const cerrentVersion = pkg.version
  const npmName = pkg.name
  const { getNpmLastVersion } = require('@haha-cli-dev/get-npm-info')
  const lastVersion = await getNpmLastVersion(cerrentVersion, npmName)
  if (lastVersion && semver.gt(lastVersion, cerrentVersion)) {
    log.warn('友情提示', colors.yellow('请更新版本:当前的版本是:', lastVersion))
  }
}

//注册命令
function registerCommander() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d,--debug', 'Is debugging mode turned on?', false)
    .option('-tp,--targetPath <targetPath>', '是否指定本地调试文件路径？')

  //初始化模式
  program
    .command('init [name]')
    .description('初始化项目')
    .alias('i') //添加别名
    .option('-f,--force', '是否强制初始化')
    .action(exec)

  program
    .command('publish')
    .description('发布项目')
    .alias('p') //添加别名
    .option('--refreshServer','强制更新远程仓库')
    .action(exec)

  //注册debug模式
  program //记得加上program 否则init 命令的name参数打印不对
    .on('option:debug', () => {
      if (program.opts()?.debug) {
        process.env.LOG_LEVEL = 'verbose'
      } else {
        process.env.LOG_LEVEL = 'info'
      }
      log.level = process.env.LOG_LEVEL
      log.verbose('test debug')
    })

  program.on('option:targetPath', () => {
    //本地调试代码地址
    process.env.CLI_TARGET_PATH = program._optionValues.targetPath
  })

  // 监听未注册的所有命令
  program
    .on('command:*', obj => {
      log.info('obj',obj)
      const availableCommand = program.commands.map(command => command._name)
      log.info(colors.red('未知的命令 ' + obj[0]))
      if (availableCommand.length) {
        log.info(colors.blue('支持的命令 ' + availableCommand.join(',')))
      }
    })
    .parse(process.argv)

  //判断是否输入命令， 没输入则显示帮助文档
  if (process.args && program.args.length < 1) {
    program.outputHelp()
  }
}

module.exports = core
