const request = require('@haha-cli-dev/request')

process.env.HAHA_CLI_BASE_URL = process.env.HAHA_CLI_BASE_URL || 'http://127.0.0.1:7001'

function getTemplate() {
  return request({
    url: `${process.env.HAHA_CLI_BASE_URL}/project/getTemplate`
  })
}

module.exports = { getTemplate }
