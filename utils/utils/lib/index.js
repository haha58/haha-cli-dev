'use strict'

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

module.exports = { isObject, spinnerStart, sleep }
