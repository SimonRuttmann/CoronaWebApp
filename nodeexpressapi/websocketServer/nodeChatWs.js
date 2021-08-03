const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();

const port = 3000;
const server = http.createServer(app);
//const webSocketServer = new WebSocket.Server({ server })
/*
webSocketServer.on('connection', connectionFunction(ws));

  function connectionFunction(ws){
    ws.on('message', function incoming(data) {
      webSocketServer.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      })
    })
  }
*/
app.get('/', (req,res)=> {
  res.send('Hallo über HTTP');
})
server.listen(port, function() {
  console.log(`Server is listening on ${port}!`)
})




/*
webSocketServer.on('connection', function connection(ws) {


  ws.on('message', function incoming(data) {
    webSocketServer.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    })
  })
})
*/