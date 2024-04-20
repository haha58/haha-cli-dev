'use strict'

const axios = require('axios')
const urlJoin = require('url-join')
const semver = require('semver')
//调用npm API,得到npm信息
function getNpmInfo(npmName, register) {
  if (!npmName) return null
  const registerUrl = getRegister()
  const url = urlJoin(registerUrl, npmName)
  return axios
    .get(url)
    .then(function (res) {
      if (res.status === 200) {
        return res.data
      }
      return null
    })
    .catch(function (error) {
      return Promise.reject(error)
    })
}

//得到镜像地址
function getRegister(isOrigin = false) {
  return isOrigin ? 'https://registry.npmjs.org/' : 'https://registry.npmmirror.com /'
}

//获取所有的版本号
async function getNpmVersions(npmName) {
  const npmInfo = await getNpmInfo(npmName)
  if (npmInfo) {
    return Object.keys(npmInfo.versions)
  }
  return []
}

//比对哪些版本号是大于当前版本号,并排序
function getNpmSemverVersions(baseVersion, versions) {
  if (!versions || versions.length === 0) {
    return null
  }
  //(semver.gt(b, a) 返回true,false sort不能识别 !!
  return versions.filter(version => semver.satisfies(version, `>=${baseVersion}`)).sort((a, b) => (semver.gt(b, a) ? 1 : -1))
}

//获取最新的版本号
async function getNpmLastVersion(baseVersion, npmName, register) {
  const versions = await getNpmVersions(npmName)
  if (baseVersion === 'lastest') {
    baseVersion = versions[0]
  }

  const newVersions = getNpmSemverVersions(baseVersion, versions)

  if (newVersions && newVersions.length > 0) {
    return newVersions[0]
  }
  return null
}

module.exports = {
  getNpmInfo,
  getRegister,
  getNpmVersions,
  getNpmSemverVersions,
  getNpmLastVersion
}
