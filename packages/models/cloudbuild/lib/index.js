'use strict';

const io = require('socket.io-client')
const log = require('@haha-cli-dev/log');
const get = require('lodash/get');

const TIME_OUT = 5 * 60 * 1000
const WS_SERVER = 'http://127.0.0.1:7001'
const CONNECT_TIME_OUT = 5 * 1000

function parseMsg(msg) {
  //msg 通过.的形式得到对象
  const action = get(msg, 'data.action')
  const payload = get(msg, 'data.payload')
  return {
    action,
    payload
  }
}
class Cloudbuild {
  constructor(git, options) {
    this.git = git
    this.buildCmd = options.buildCmd
    this.timeout = TIME_OUT
  }

  doTimeout(fn, timeout) {
    this.timer && clearTimeout(this.timer)
    log.info('设置任务超时时间：', `${timeout / 1000}秒`)
    this.timer = setTimeout(fn, timeout)
  }


  //创建websocket链接
  init() {
    return new Promise((resolve,reject)=>{
    const socket = io(WS_SERVER, {
      query: {
        repo: this.git.remote,
        name:this.git.name,
        branch:this.git.branch,
        version:this.git.version,
        buildCmd:this.git.buildCmd
      }
    });
    socket.on('connect', () => {
     /* const id = socket.id;
        socket.on(id, msg => {
        log('#receive,', msg);
        const parsedMsg = parseMsg(msg);
        log.success(parsedMsg.action, parsedMsg.message);
      });
      */
      resolve()
    });

    socket.on('id', msg => {
      const parseedMsg = parseMsg(msg)
      log.success('云构建任务创建成功', `任务ID：${parseedMsg.payload.id}`)
      log.success(parseedMsg.action, parseedMsg.payload.message)
    })

    const disconnect = () => {
      clearTimeout(this.timer)
      socket.disconnect()
      socket.close()
    }
    this.doTimeout(() => {
      log.error('云构建服务连接超时，自动终止')
      disconnect()
    }, CONNECT_TIME_OUT)

    socket.on('disconnect', () => {
      log.success('disconnect', '云构建任务断开')
      disconnect()
    })
    socket.on('error', () => {
      log.error('error', '云构建出错', err)
      reject(err)
      disconnect()
    })
    this.socket=socket
  })
  }

  build(){
    return new Promise((resolve,reject)=>{
      this.socket.emit('build')  //触发服务端build事件
      this.socket.on('build',(msg)=>{  //监听服务端build事件
          const parsedMsg=parseMsg(msg)
          log.success("parsedMsg",parsedMsg)
        })
        this.socket.on('building',(msg)=>{  //监听building-正在构建的事件
      })
    })
  }
}




module.exports = Cloudbuild