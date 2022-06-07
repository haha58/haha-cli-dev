'use strict'

const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const semver = require('semver')

const Command = require('@haha-cli-dev/command')
const log = require('@haha-cli-dev/log')
const packages = require('@haha-cli-dev/packages')
const { spinnerStart } = require('@haha-cli-dev/utils')

const { getTemplate } = require('./template')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'
const templateTypes = {
  TEMPLATE_TYPE_NORMAL: 'normal',
  TEMPLATE_TYPE_CUSTOM: 'custom'
}

class initCommand extends Command {
  init() {
    this.projectName = this._argv[0]
  }

  /*
    1、准备阶段
    2、下载模板
    3、安装模板
   */
  async exec() {
    try {
      //记得加上async，使同步运行，一个trycatch可以捕获方法内的错误
      //1、准备阶段
      this.projectInfo = await this.prepare()
      if (!this.projectInfo) return false
      //2、下载模板
      await this.downloadTemplate()
      //3、安装模板
      await this.installTemplate()
    } catch (e) {
      log.error(e.message)
    }
  }

  async installTemplate() {
    console.log(this.template, this.template.npmType)
    if (this.template) {
      if (!this.template.npmType) {
        this.template.npmType = templateTypes.TEMPLATE_TYPE_NORMAL
      }
      if (this.template.npmType === templateTypes.TEMPLATE_TYPE_CUSTOM) {
        await this.installCustomTemplate()
      } else if (this.template.npmType === templateTypes.TEMPLATE_TYPE_NORMAL) {
        await this.installNormalTemplate()
      } else {
        throw new Error('无法识别项目模板信息')
      }
    } else {
      throw new Error('项目模板信息不存在')
    }
  }

  //自定义安装
  async installCustomTemplate() {}

  //标准安装
  async installNormalTemplate() {
    const spinner = spinnerStart()
    try {
      //拷贝模板代码到当前目录
      const templatePath = path.resolve(this.pkg.cacheFilePath, 'template')
      const targetPath = process.cwd()
      fse.ensureDirSync(templatePath)
      fse.ensureDirSync(targetPath)
      fs.copySync(templatePath, targetPath)
    } catch (error) {
      throw error
    } finally {
      spinner.stop(true)
    }
  }

  /*
  下载模板
    1、通过项目模板API获取项目模板信息
     1.1通过egg.js搭建后端系统
     1.2通过npm存储项目模板
     1.3将项目模板信息存储到mongoDB数据库中
     1.4通过egg.js获取mongoDB的数据并通过API返回
    3、选择创建组件或项目
    4、获取项目的基本信息
  */
  async downloadTemplate() {
    const homePath = process.env.CLI_HOME_PATH
    const targetPath = path.resolve(homePath, 'templates')
    const storeDir = path.resolve(targetPath, 'node_modules')
    this.template = this.templates.find(item => item.npmName === this.projectInfo.npmName)
    const { npmName, version } = this.template
    this.pkg = new packages({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version
    })
    if (await this.pkg.exists()) {
      const spinner = spinnerStart('模板更新中，请稍候')
      try {
        //更新
        await this.pkg.update()
      } catch (error) {
        //抛出异常，让上层捕获
        throw error
      } finally {
        //解决下载出错时，仍提示下载中的情况
        spinner.stop(true)
        if (await this.pkg.exists()) {
          log.success('模板更新成功')
        }
      }
    } else {
      const spinner = spinnerStart('模板下载中，请稍候')
      try {
        //初始化
        await this.pkg.install()
      } catch (error) {
        //抛出异常，让上层捕获
        throw error
      } finally {
        //解决下载出错时，仍提示下载中的情况
        spinner.stop(true)
        if (await this.pkg.exists()) {
          log.success('模板下载成功')
        }
      }
    }
  }

  /*
    准备阶段
    1、判断当前目录是否为空
      1.1 询问是否继续创建
    2、是否启动强制更新
    3、选择创建组件或项目
    4、获取项目的基本信息
  */
  async prepare() {
    //当前执行node命令时候的文件夹地址 ——工作目录
    const localPath = process.cwd()
    const force = this._argv[1]?.force
    let isContinue = false
    this.templates = await getTemplate()
    //判断模板是否存在
    if (!this.templates || this.templates.length === 0) {
      throw new Error('当前不存在项目模板')
    }
    if (this.isCmdEmpty(localPath)) {
      //1.1 询问是否继续创建
      if (!force) {
        const res = await inquirer.prompt({
          type: 'confirm',
          name: 'isContinue',
          message: '当前文件夹内容不为空,是否在此继续创建项目?',
          default: false
        })
        isContinue = res.isContinue
        if (!isContinue) {
          return false
        }
      }
    }
    // 2.是否启动强制安装
    if (isContinue || force) {
      const { isDelete } = await inquirer.prompt({
        type: 'confirm',
        name: 'isDelete',
        message: '是否清空当前目录下的文件?',
        default: false
      })
      if (isDelete) {
        // 清空当前目录
        fse.emptyDirSync(localPath)
      }
    }
    return this.getBaseInfo()
  }

  //3、选择创建项目或组件
  async getBaseInfo() {
    const { type } = await inquirer.prompt({
      type: 'list',
      message: '请选择初始化类型',
      name: 'type',
      default: TYPE_PROJECT,
      choices: [
        {
          name: '项目',
          value: TYPE_PROJECT
        },
        {
          name: '组件',
          value: TYPE_COMPONENT
        }
      ]
    })
    if (type === TYPE_COMPONENT) {
    }
    if (type === TYPE_PROJECT) {
      const { project, version } = await inquirer.prompt([
        {
          type: 'input',
          message: '请输入项目名称',
          name: 'project',
          default: 'haha-demo',
          validate: function (val) {
            //检查项目名称和版本号的合法性
            const done = this.async()
            setTimeout(function () {
              //1、必须首字母大写，
              //2、尾字符必须为英文或者数字，不能为字符
              //3、字符仅允许'-_'
              //类型合法有：a a-b a_b a-b-c a_b_c a1_b1_c1 a1 a1-b1-c1
              if (!/^[a-zA-Z]+([-][a-zA-Z0-9]|[_][a-zA-Z0-9]|[a-zA-Z0-9])*$/.test(val)) {
                done('请输入合法的项目名称(要求英文字母开头,数字或字母结尾,字符只允许使用 - 以及 _)')
                return
              }
              done(null, true)
            }, 0)
          }
        },
        {
          type: 'input',
          message: '请输入项目版本号',
          name: 'version',
          default: '1.0.0',
          validate: function (val) {
            const done = this.async()
            setTimeout(function () {
              //!!semver.valid(val) !!转成Boolean类型
              if (!!!semver.valid(val)) {
                done('请输入合法的版本号')
                return
              }
              done(null, true)
            }, 0)
          },
          filter: val => {
            if (!!semver.valid(val)) {
              return semver.valid(val)
            }
            return val
          }
        }
      ])
      //添加选择模板交互
      const { npmName } = await inquirer.prompt({
        type: 'list',
        message: '请选择项目模板',
        name: 'npmName',
        choices: this.createTemplateChoice()
      })
      //4、获取项目的基本信息
      return {
        type,
        project,
        version,
        npmName
      }
    }
  }

  createTemplateChoice() {
    return this.templates?.map(item => ({
      name: item.name,
      value: item.npmName
    }))
  }

  //判断当前路径是否不为空
  isCmdEmpty(localPath) {
    let fileList = fs.readdirSync(localPath)
    fileList = fileList.filter(item => !item.startsWith('.') && item !== 'node_modules')
    return fileList && fileList.length > 0
  }
}

function init(argv) {
  return new initCommand(argv)
}

module.exports = init
module.exports.initCommand = initCommand
