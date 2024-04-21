"use strict"

const path = require("path")

const packages = require("@haha-cli-dev/packages")
const log = require("@haha-cli-dev/log")
const { execAysnc } = require("@haha-cli-dev/utils")

const SETTINGS = {
  init: "@haha-cli-dev/init",
  publish:'@haha-cli-dev/publish'
}

const CACHE_DIR = "dependencies"

async function exec(...argv) {
  log.level = process.env.LOG_LEVEL
  let targetPath = process.env.CLI_TARGET_PATH
  const homePath = process.env.CLI_HOME_PATH
  let storeDir = ""
  const cmdObj = arguments[arguments.length - 1]
  const packageName = SETTINGS[cmdObj._name]
  log.verbose("packageName",cmdObj,packageName)
  let pkg
  //是否执行本地代码
  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR)
    storeDir = path.resolve(targetPath, "node_modules")
    log.verbose("targetPath", targetPath)
    log.verbose("storeDir", storeDir)
    pkg = new packages({
      targetPath,
      storeDir,
      packageName,
      packageVersion: "latest"
    })
    if (await pkg.exists()) {
      //更新
      await pkg.update()
    } else {
      //初始化
      await pkg.install()
    }
  } else {
    pkg = new packages({
      targetPath,
      packageName,
      packageVersion: "latest"
    })
  }
  //获取本地代码入口文件
  const rootFile = pkg.getRootFilePath()
  log.verbose("rootFile", rootFile)
  log.verbose("pkg", pkg)
  if (rootFile) {
    //cli已经对全局的异常进行了捕获，为什么在这里仍需要使用try，catch捕获command的异常，因为在使用了program.action异步处理了。异常处理的都需要重新捕获异常
    try {
      const cmd = argv[argv.length - 1]
      const newCmd = Object.create(null)
      Object.keys(cmd).forEach(key => {
        if (cmd.hasOwnProperty(key) && !key.startsWith("_") && key !== "parent") {
          newCmd[key] = cmd[key]
        }
      })
      argv[argv.length - 1] = newCmd
      try {
        //code是字符串 ！！！ require(路径（字符串）)(参数（字符串）)
        const code = `require('${rootFile}')(${JSON.stringify(argv)})`
        //在 node 子进程中调用 提高速度
        const ret = await execAysnc("node", ["-e", code], {
          cwd: process.cwd(), //cwd 子进程的当前工作目录
          stdio: "inherit" //inherit  将相应的stdio传给父进程或者从父进程传入，相当于process.stdin,process.stout和process.stderr
        })
        if (ret !== 0) {
          process.exit(1)
        } else {
          log.verbose("命令执行成功", ret)
          process.exit(ret)
        }
      } catch (error) {
        throw error
      }
    } catch (error) {
      console.log(error)
      log.verbose(error.message)
    }
  }
}

module.exports = exec
