'use strict';
const net = require('net');
const message = require('./message')
const Pieces = require('./Pieces');
const messageParser = require('./messageParser')
const fs = require('fs');
let firstPiece === true;

module.exports.startServer = (torrent) => {
    const server = net.createServer(function(c) {
    listenForIncomingConnections(c, msg => seedMsgHandler(msg, c, torrent));
  });
  server.listen(6881);
}

function listenForIncomingConnections(c, callback) {
  let savedBuf = Buffer.alloc(0);
  let handshake = true;

  c.on('data', function(data) {
    const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
    savedBuf = Buffer.concat([savedBuf, data]);

    while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
      callback(savedBuf.slice(0, msgLen()));
      savedBuf = savedBuf.slice(msgLen());
      handshake = false;
    }
  })
}

function seedMsgHandler(msg, c, torrent) { // need to be able to parse additional message Ids
  if (isHandshake(msg)) {
    console.log('New Peer Connected')
    console.log('Handshake Received')
    c.write(message.buildHandshake(torrent));
    console.log('-> Return Handshake Sent')
  } else {
    const m = messageParser.parse(msg);
    if (m.id === 2) {
      sendHaveMessages(c, torrent, m.payload);
      sendUnchokeMessage(c);
    }
    if (m.id === 6) sendPiece(c, m.payload, torrent)
  }
}

function sendHaveMessages(c, torrent, msg) {
  console.log('Telling the peer which pieces of the file they can get from us...')
  const pieces = new Pieces(torrent);
  const nPieces = pieces._requested;  //cycle through each piece we have
  nPieces.forEach((piece, index) => c.write(message.buildHave(index)));
}

function sendUnchokeMessage(c) {
  console.log('Accepting Transfer');
  c.write(message.buildUnchoke());
}

function sendPiece(c, msg, torrent) {
  if (firstPiece) {console.log('Sending the File pieces...')}
  firstPiece = false;
  const pieceLength = torrent.info['piece length'];
  getPieceOfFile(msg, torrent, pieceLength).then((res)=>{
    c.write(message.buildPiece(msg, torrent, res, pieceLength));
  });
}

function getPieceOfFile(payload, torrent, pieceLength) {
  return new Promise((res, rej)=>{
    fs.open('./' + torrent.info.name.toString('utf8'), 'r', function(err, fd) {
      var buffer = new Buffer(pieceLength);
      fs.read(fd, buffer, 0, pieceLength, payload.index * pieceLength, function(err, bytesRead, buffer) {
        res(buffer);
      });
    });
  });
}

function isHandshake(msg) {
  return msg.length === msg.readUInt8(0) + 49 &&
         msg.toString('utf8', 1, 20) === 'BitTorrent protocol';
}
