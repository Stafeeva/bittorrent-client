'use strict';

const torrentParser = require('./src/torrentParser');
const Download = require ('./src/download')
const torrent = torrentParser.open(process.argv[2]);
const fileSize = require('fs').statSync("./" + torrent.info.name).size

if (fileSize >= torrent.info.length) {
  const server = require('./src/server.js')
  server.startServer(torrent);
} else {
  const download = new Download(torrent, torrent.info.name);
  download.start();
}
