'use strict';

const torrentParser = require('./src/torrentParser');
const Download = require ('./src/download')
const torrent = torrentParser.open(process.argv[2]);

const download = new Download(torrent, torrent.info.name);
const server = require('./src/server.js')
download.start();
