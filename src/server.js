'use strict';
const net = require('net');
const message = require('./message')
const Pieces = require('./Pieces');
const messageParser = require('./messageParser')
const fs = require('fs');

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
    console.log('A NEW INCOMING CONNECTION FROM PEER 2')
    console.log(data.toString('utf8'))
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
    console.log('peer1 heard an incoming handshake from peer2')
    c.write(message.buildHandshake(torrent));
    console.log('hanshake sent!')
  } else {
    const m = messageParser.parse(msg);
    console.log(m);
    console.log('that was the parsed msg above')
    // handles the Interested message -> reply with Unchoke message
    if (m.id === 2) {
      sendHaveMessages(c, torrent, m.payload);
      sendUnchokeMessage(c);
    }
    // next message in should be a requestPiece message -> reply with Piece
    if (m.id === 6) sendPiece(c, m.payload, torrent)
  }
}

function sendHaveMessages(c, torrent, msg) {
  console.log('sending the have messages')
  // c.write(message.buildUnchoke())
  const pieces = new Pieces(torrent);
  const nPieces = pieces._requested;  //cycle through each piece we have
  nPieces.forEach((piece, index) => c.write(message.buildHave(index)));
}

function sendUnchokeMessage(c) {
  console.log('sending unchoke');
  c.write(message.buildUnchoke());
}

function sendPiece(c, msg, torrent) {
  // how to find the requested piece, and build it???
  // some kind of msg parsing to get the index of the piece requested
  const pieceLength = torrent.info['piece length'];
  getPieceOfFile(msg, torrent, pieceLength).then((res)=>{
    c.write(message.buildPiece(msg, torrent, res, pieceLength));
  });
  //should write to an actual file
  console.log('peer 1 sent the piece!!!!!')
}

function getPieceOfFile(payload, torrent, pieceLength) {
  return new Promise((res, rej)=>{
    console.log(torrent)
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
