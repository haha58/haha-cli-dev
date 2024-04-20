'use strict'

const path = require('path')

/**
 * @description:匹配路径，因为window环境的路径是\,ios是/,可能后续会产生一些文艺
 */
function formatPath(p) {
  if (typeof p === 'string' && p.sep === '/') {
    return p
  } else {
    return p.replace(/\\/g, '/')
  }
}

module.exports = formatPath
