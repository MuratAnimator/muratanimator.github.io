const express = require('express');
const { ExpressPeerServer } = require('peer');

const app = express();
const server = app.listen(3000);

// Настройка PeerJS
const peerServer = ExpressPeerServer(server, {
  path: 'HTML/Among us'
});

app.use('/peerjs', peerServer);