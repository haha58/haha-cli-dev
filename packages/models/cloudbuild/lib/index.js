'use strict';

const io = require('socket.io-client')
const log=require('@haha-cli-dev/log')

const TIME_OUT=5*60*1000
const WS_SERVER='http://127.0.0.1:7001'
const CONNECT_TIME_OUT=5*1000
class Cloudbuild {
  constructor(git, options) {
    this.git=git
    this.buildCmd=options.buildCmd
    this.timeout=TIME_OUT
  }

  doTimeout(fn,timeout){
    this.timer&&clearTimeout(this.timer)
    log.info('设置任务超时时间：',`${timeout/1000}秒`)
    this.timer=setTimeout(fn,timeout)
  }


  //创建websocket链接
  init(){
    const socket = io(WS_SERVER,{
      query:{
        repo:this.git.remote
      }
    });
    socket.on('connect', () => {
      console.log('connect!');
    });
    const disconnect=()=>{
      clearTimeout(this.timer)
      socket.disconnect()
      socket.close()
    }
    this.doTimeout(()=>{
      log.error('云构建服务连接超时，自动终止')
      disconnect()
    },CONNECT_TIME_OUT)
  }
}

module.exports = Cloudbuild