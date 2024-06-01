'use strict';

const io = require('socket.io-client')

const TIME_OUT=5*60
const WS_SERVER='http://127.0.0.1:7001'

class Cloudbuild {
  constructor(git, options) {
    this.git=git
    this.buildCmd=options.buildCmd
    this.timeout=TIME_OUT
  }

  //创建websocket链接
  init(){
    const socket = io(WS_SERVER,{
      query:{
        
      }
    });
  }
}

// const socket = require('socket.io-client')('http://127.0.0.1:7001');

// socket.on('connect', () => {
//   console.log('connect!');
//   socket.emit('chat', 'hello world!');
//   socket.emit('hello', '');
//   socket.emit('welcome', '');
// });

// socket.on('res', msg => {
//   console.log('res from server: %s!', msg);
// });
module.exports = Cloudbuild