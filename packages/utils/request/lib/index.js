'use strict'

const axios = require('axios')

//设置了baseUrl会报connect ECONNREFUSED 127.0.0.1:80
// const baseURL = process.env.HAHA_CLI_BASE_URL ? process.env.HAHA_CLI_BASE_URL : 'http://127.0.0.1:7001'

axios.create({
  //   baseURL,
  timeout: 5000
})

axios.interceptors.response.use(
  function (response) {
    return response.data
  },
  function (error) {
    return Promise.reject(error)
  }
)

module.exports = axios
