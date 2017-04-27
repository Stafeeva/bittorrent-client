'use strict'
const net = require('net');
const messageParser = require('./messageParser');

module.exports = (peer, socket = new net.Socket()) => {
  socket.on('error', console.log);
  socket.connect(peer.port, peer.ip, () => {
    socket.write('hello');
  });
  dataHandler(socket, msg => { messageHandler(msg, peer, socket)});
}

const dataHandler = (socket, callback) => {
  let handshake = true;
  let newBuffer = Buffer.alloc(0);

  socket.on('data', data => {

    const msgLen = () => handshake ? newBuffer.readUInt8(0) : newBuffer.readInt32BE(0) + 4;
    newBuffer = Buffer.concat([newbuffer, data]);

    // while messageParser.isWholeMessage(data, msgLen) {
      callback(data);
      handshake = false;
    // }
  });


};

module.exports.dataHandler = dataHandler;
