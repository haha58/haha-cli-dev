#!/usr/bin/env node

const imporLocal = require('import-local')

if (imporLocal(__filename)) {
  require('npmlog').info('cli', '正在使用本地版本')
} else {
  require('../lib')(process.argv.slice(2))
}
