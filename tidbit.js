'use strict';

const torrentParser = require('./src/torrentParser');
const Download = require ('./src/download')
const torrent = torrentParser.open(process.argv[2]);
const fs = require('fs')
let fileSize;

try {
  fileSize = fs.statSync("./" + torrent.info.name).size;
} catch(e) {
  fileSize = 0;
}

if (fileSize >= torrent.info.length) {
  const server = require('./src/server.js')
  console.log("Seeding " + torrent.info.name + "...")
  server.startServer(torrent);
} else {
  const download = new Download(torrent, torrent.info.name);
  console.log("Downloading " + torrent.info.name + "...")
  download.start();
}
