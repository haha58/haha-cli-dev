'use strict'

const pkgDir = require('pkg-dir')

const { isObject } = require('@haha-cli-dev/utils')

class Packages {
  constructor(options) {
    if (!options) {
      throw new Error('Packages类参数不能为空')
    }
    if (!isObject(options)) {
      throw new Error('Packages类参数必须是Object类型')
    }
    //Packages 路径
    this.targetPath = options.targetPath
    //Packages 存储路径
    this.storePath = options.storePath
    //Packages name
    this.packageName = options.packageName
    //Packages version
    this.packageVersion = options.packageVersion
  }

  //判断packages是否存在
  exists() {}
  /**
   * @description:获取入口文件的路径
   * 1.获取package.json所在的目录 pkg-dir
   * 2.读取package.json
   * 3.找到main或者lib属性 形成路径
   * 4.路径的兼容(macOs/windows)
   */
  getRootFilePath() {}
}

module.exports = Packages
