const http = require('http');
const express = require('express');
const ws = require('ws');

const app = express();

app.get('/',(req,res)=> {
    res.send('Hallo über HTTP');
});

const server = http.createServer(app);
const wsServer = new ws.Server({server})

wsServer.on('connection', socket => {
    console.log("Client hat Verbinung zum Websocket Server hergestellt");
    socket.on('message', data => {
        const message = JSON.parse(data);

        switch(message.type){
            case 'ping':
                socket.send(JSON.stringify({type: 'ping', reply: 'pong'})); break;
            case 'request':
                socket.send(JSON.stringify({type: 'request', reply: 'response'})); break;
            default: 
                socket.send(JSON.stringify({type: 'error'}));        
        }
        console.log("Nachricht vom Client erhalten");
        socket.send('message');
    })
})

//Kommunikationsmuster:
//  Request - Response      ID vergeben, damit man weiß zu welchem Request ein Response gebraucht wird
//  Publish - Subscribe     Erfordert zusätzliche Nachrichten für subscribe und unsubscribe
//Chrome-Browser BuildIn WebSocketsa
//socket = new WebSocket('ws://localhost:3000')
//socket.onmessage = function(message){ console.log(message)}
//socket.send("Hallo vom Client")

//Heartbeat beispiel
//Vorsicht alle, auch welche versuchen gerade die verbindung aufzubauen oder zu beenden
setInterval( () => {
    wsServer.clients.forEach(client => {
        if(client.readyState !== ws.OPEN){
            return; //Returned anonyme funktion
        }
        client.send(JSON.stringify({type: 'heartbeat'}));
    });

}, 10000)

//Abfragen aller Clients über wsServer.clients 

server.listen(3000, () => {
    console.log("Server is running on Port 3000")
});

//Json.Stringify -> Ws -> Json.parse