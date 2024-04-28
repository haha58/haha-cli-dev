'use strict'

const { resolve } = require('path')
const fse = require('fs-extra')

function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]'
}

var Spinner = require('cli-spinner').Spinner
function spinnerStart(msg) {
  var spinner = new Spinner(msg + '.. %s')
  spinner.setSpinnerString('|/-\\')
  spinner.start()
  return spinner
}

function sleep() {
  return new Promise((resolve, reject) => setTimeout(resolve, 1000))
}

function exec(command, args, options = {}) {
  const win32 = process.platform === 'win32'
  const cmd = win32 ? 'cmd' : command
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args
  return require('child_process').spawn(cmd, cmdArgs, options)
}

function execAysnc(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const cp = exec(command, args, options)
    cp.on('error', function (error) {
      reject(error)
    })
    cp.on('exit', e => {
      resolve(e)
    })
  })
}

function writeFile(path,data,{rewrite=true}={}){
  if(fse.existsSync(path)){
    if(rewrite){
      fse.writeFileSync(path,data)
      return true
    }
    return false
  }else{
    fse.writeFileSync(path,data)
    return true
  }
}

function readFile(path,options={}){
  if(fse.existsSync(path)){
    const buffer=fse.readFileSync(path)
    if(buffer){
      if(options?.toJson){
        return buffer.toJSON()
      }else{
        return buffer.toString()
      }
    }
  }
  return null
}
module.exports = { 
  isObject,
  spinnerStart, 
  sleep, 
  execAysnc,
  readFile,
  writeFile 
}
