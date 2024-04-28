"use strict"

//node内置的包要放在最外面
const path = require("path")
const pathExists = require("path-exists")
const fsExtra = require("fs-extra")
const fs = require("fs")
const pkgDir = require("pkg-dir").sync
const npminstall = require("npminstall")

const { isObject } = require("@haha-cli-dev/utils")
const formatPath = require("@haha-cli-dev/format-path")
const { getRegister, getNpmLastVersion } = require("@haha-cli-dev/get-npm-info")

//1、targetPath ->modulePath(通过targetPath 拿到实际的modulePath)
//2、modulePath ->Package(npm模块) 将modulePath生成一个通用的package
//3、Package.getRootFIle(获取入口文件)  这样以后扩展直接处理package的逻辑就可以，而不需要将getRootFIle暴露在外面

//封装--->复用

class Packages {
  constructor(options) {
    if (!options) {
      throw new Error("Packages类参数不能为空")
    }
    if (!isObject(options)) {
      throw new Error("Packages类参数必须是Object类型")
    }
    // 获取 targetPath ,如果没有 则说明不是一个本地的package
    this.targetPath = options.targetPath
    // 模块安装位置 缓存路径
    this.storeDir = options.storeDir
    //Packages name
    this.packageName = options.packageName
    //Packages version
    this.packageVersion = options.packageVersion
    //前缀
    this.cacheFilePathPrefix = options.packageName.replace("/", "_")
  }

  //准备工作
  async prepare() {
    if (this.storeDir && !(await pathExists(this.storeDir))) {
      //确保文件夹存在，不存在就创建它
      await fsExtra.ensureDirSync(this.storeDir)
    }
    if (this.packageVersion === "latest") {
      this.packageVersion = await getNpmLastVersion(this.packageVersion, this.packageName, true)
    }
  }

  //获取当前模块缓存路径
  get cacheFilePath() {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
  }

  //缓存目录是否存在
  async exists() {
    if (this.storeDir) {
      await this.prepare()
      return await pathExists(this.cacheFilePath)
    } else {
      return await pathExists(this.targetPath)
    }
  }

  //安装package
  install() {
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      pkgs: [{ name: this.packageName, version: this.packageVersion }],
      registry: getRegister()
    })
  }

  /**
   * @description:读取版本号
   * 1.获取最新版本号
   * 2.查询本地是否已经是最新版本
   * 3.如果不是最新版本 安装最新版本
   */
  async update() {
    const lastestVersion = await getNpmLastVersion(this.packageVersion, this.packageName, true)
    const lastestPath = path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${lastestVersion}@${this.packageName}`)
    if (!(await pathExists(lastestPath))) {
      this.packageVersion = lastestVersion
      return npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        pkgs: [{ name: this.packageName, version: lastestVersion }],
        registry: getRegister()
      })
    }
  }

  /**
   * @description:获取入口文件的路径
   * 1.获取package.json所在的目录 pkg-dir
   * 2.读取package.json
   * 3.找到main或者lib属性 形成路径
   * 4.路径的兼容(macOs/windows)
   */
  getRootFilePath() {
    function _getRootFilePath(_path,flag) {
      let rootDir=''
      if(flag){
        rootDir = pkgDir(_path)
      }
      const pkgFile = require(path.resolve(rootDir, "package.json"))
      const lib = pkgFile && (pkgFile.lib || pkgFile.main)
      if (lib) {
        return formatPath(path.resolve(rootDir, lib))
      }
      return null
    }
    // 如果 this.storeDir 存在 ,就是需要下载安装,否则就是本地安装
    if (this.storeDir) {
      return _getRootFilePath(this.cacheFilePath,true)
    } else {
      return _getRootFilePath(this.targetPath,false)
    }
  }
}

module.exports = Packages
