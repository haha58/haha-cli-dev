'use strict'

const { resolve } = require('path')

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

module.exports = { isObject, spinnerStart, sleep, execAysnc }
