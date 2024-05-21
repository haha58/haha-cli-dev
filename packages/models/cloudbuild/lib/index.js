'use strict';

class Cloudbuild{

}

const socket = require('socket.io-client')('http://127.0.0.1:7001');

socket.on('connect', () => {
  console.log('connect!');
  socket.emit('chat', 'hello world!');
  socket.emit('hello', '');
  socket.emit('welcome', '');
});

socket.on('res', msg => {
  console.log('res from server: %s!', msg);
});
module.exports=Cloudbuild