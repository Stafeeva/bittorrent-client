'use strict';
const net = require('net');
const connect = require('../src/connect');

describe("Connect", () => {

  const peer = {
    port: 'port',
    ip: 'ip'
  }

  it('creates a new socket with peer', () => {
    spyOn(net.Socket.prototype, "on");
    connect(peer);
    expect(net.Socket.prototype.on).toHaveBeenCalled();
  });

  it('should connect to the socket', () => {
    spyOn(net.Socket.prototype, "connect");
    connect(peer);
    expect(net.Socket.prototype.connect).toHaveBeenCalledWith(peer.port, peer.ip);
  });

  // it('should not show an error if the socket connects', () => {
  //   spyOn(net.Socket.prototype, "on");
  //   connect(peer);
  //   expect(net.Socket.prototype.on).not.toHaveBeenCalledWith('error', console.log);
  // });
  //
  // it("should show an error if the socket doesn't connect", () => {
  //   spyOn(net.Socket.prototype, "on");
  //   connect();
  //   expect(net.Socket.prototype.on).toHaveBeenCalledWith('error', console.log);
  // });

});
