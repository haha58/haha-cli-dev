'use strict'

const log = require('npmlog')

// 从环境变量中读取 log.level
// log.level 的作用是: 只有超过 level 设置的权重，log 才会生效
log.level = process.env.LOG_LEVEL || 'info'
// 定制 log 的 level    参数: (名称,权重,配置)
log.addLevel('success', 2000, { fg: 'green' })

//定义log的前缀
// log.heading = 'haha'

// 定制 log 前缀的样式
log.headingStyle = { fg: 'blue', bg: 'green', bold: true }

module.exports = log
