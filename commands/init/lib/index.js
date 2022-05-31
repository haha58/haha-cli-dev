'use strict'

const fs = require('fs')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const Command = require('@haha-cli-dev/command')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

class initCommand extends Command {
  init() {
    this.projectName = this._argv[0]
    console.log('projectName', this.projectName)
  }

  exec() {
    //1、准备阶段
    this.prepare()

    //2、下载模板
    //3、安装模板
  }

  async prepare() {
    //当前执行node命令时候的文件夹地址 ——工作目录
    const localPath = process.cwd()
    const force = this._argv[1]?.force
    let isContinue = false
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

  // throw new Error('hah')
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
      const { info } = await inquirer.prompt([
        {
          type: 'input',
          message: '请输入项目名称',
          name: 'project',
          default: 'haha-demo',
          validate: val => {
            return typeof val === 'string'
          }
        },
        {
          type: 'input',
          message: '请输入项目版本号',
          name: 'version',
          default: '1.0.0',
          validate: val => {
            return true
          },
          filter: val => {}
        }
      ])
      return {
        type,
        project: info.project,
        version: info.version
      }
    }
  }
  //4、获取项目的基本信息

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
