const http = require('http');
const express = require('express');
const ws = require('ws');

const app = express();

//MongoDb
const { MongoClient } = require("mongodb");
const uri = "...";
const ourDb = "....";
const client = new MongoClient(uri);

//MySql-Pool
const mysql = require('mysql');
const { result } = require('lodash');
var mysqlPool = mysql.createPool({
    connectionLimit: 10,
    host: "sql11.freemysqlhosting.net",
    user: "sql11428172",
    password: "E6Yk3KiNmZ",
    database: "sql11428172"
});

function getPwFromMySql(email){
    var selectQuery = `SELECT password 
    FROM Account WHERE email = "${email}";`

    return new Promise( (resolve, reject) => {

            mysqlPool.query(selectQuery, function (err, resultrows, fields) {
                if (err){ 
                    reject(err);
                }
                else if (resultrows.length == 0){
                    resolve(null);
                }
                else{     
                    resolve(resultrows[0].password);
                }
            });
        
    })
}





async function runMongo(mongoQuery) {
    var result;
    try{
        await client.connect();
        const database = client.db(ourDb);
        const chatColl = database.collection("chat");
        result = await mongoQuery(chatColl)
    }
    finally{
        await client.close();
        return result;
    }
};





app.get('/',(req,res)=> {
    res.send('Hallo über HTTP');
});

const server = http.createServer(app);
const wsServer = new ws.Server({server})

const topics = {
    GENERAL:    "general",
    VACCINATE:  "vaccinate",
    QUARANTINE: "quarantine",
    TEST:       "test",
    EXPERIENCE: "experience"
}

const clienttypes = {
    TOPIC: "topic",
    AUTHORIZE: "authorize",
    MESSAGE: "message"
}

const servertypes = {
    PREVMESSAGES: "prevMessages",
    ACTIVEUSERS:  "activeUsers",
    MESSAGE:      "message"
}




async function createPreviousMessages(topic){
    var mongoresult = await getPreviousMessagesFromMongo(topic);
    console.log(mongoresult);
    return mongoresult;
}

function getPreviousMessagesFromMongo(topic){
    return new Promise( async(resolve, reject) => {

        try{
            result = await runMongo(coll => {
            
                const query = {topic: `"${topic}"`};
                const projection = {id: 0};

                coll.find(query, projection);
            })

            resolve(result);
        }
        catch(e){
            reject(e);
        }
    });
}

async function checkAuthorized(email, password){
    passwordSql = await getPwFromMySql(email);
    if(passwordSql){ 
        return password == passwordSql;
    }
}


async function saveMessageInMongo(message){
    const doc = JSON.stringify(message);

    return new Promise( async(resolve, reject) => {

        try{
            result = await runMongo(coll => {

                coll.insertOne(doc);
            })

            resolve(result);
        }
        catch(e){
            reject(e);
        }
    });
}

const topics = {
    GENERAL:    "general",
    VACCINATE:  "vaccinate",
    QUARANTINE: "quarantine",
    TEST:       "test",
    EXPERIENCE: "experience"
}
//var activeAuthUsers = [];
//obj.name = name
//obj.topic = topics.XXX

function notifyAuthTopicUsers(message){
    wsServer.clients.forEach( socket => {
        if(socket.authorize)
            socket.send(message);
    })
}



function createSendUserResponse(topic){
    var usernamesByTopic = [];

    wsServer.clients.forEach( socket => {
        if(socket.topic == topic)
            usersByTopic.push(topic.name)
    })

    var userResponse = {
        type: servertypes.activeUsers,
        users: usernamesByTopic
    }
    return JSON.stringify(userResponse);

}


function notifyActiveTopicUsers(message){
    wsServer.clients.forEach( socket => {
        socket.send(message);
    })
}

wsServer.on('connection', socket => {
    console.log("Client hat Verbinung zum Websocket Server hergestellt");
    socket.topic = TOPIC.GENERAL;
    socket.authorize = false;
    socket.on('message', async data => {
        const receivedMessage = JSON.parse(data);

        switch(receivedMessage.type){
            case clienttypes.AUTHORIZE:

                    let email = receivedMessage.credentials.email;
                    let pw = receivedMessage.credentials.password; 
                
                    if(checkAuthorized(email, pw)){ 
                        socket.authorize = true;
                        socket.name=receivedMessage.credentials.name;
                        notifyAuthTopicUsers(createSendUserResponse(socket.topic))    
                    }
                    break;

            case clienttypes.TOPIC:

                    let previousTopic = receivedMessage.topic;
                    socket.topic = receivedMessage.topic;
                    socket.send(JSON.stringify(await createPreviousMessages(socket.topic)))

                    //Wenn authorisiert 1. Aus dem Alten topic entfernen, 2. Aus dem neuen topic hinzufügen
                    if(socket.authorize){
                        notifyAuthTopicUsers(createSendUserResponse(previousTopic));
                        notifyAuthTopicUsers(createSendUserResponse(socket.topic));
                    }
                    break;

            case clienttypes.MESSAGE:
                    
                    if(socket.authorize){
                        saveMessageInMongo(receivedMessage);
                        notifyActiveTopicUsers(JSON.stringify(receivedMessage));
                    }
                    break;

            default: console.log("Unknown type received: " + receivedMessage.type);
        }
    })
});

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
})


//Json.Stringify -> Ws -> Json.parse


/*

{
    credentials: 
        {
            email: "...", 
            password: "..."
        },
    meta:
        {
            username: "...",
            time: "...",
            topic: "..."
        },
    message: "........"
}
*/

/*  
Clientseitige Nachrichten:

topic = general
{
    "type":   "topic",
    "topic":  "general"
}

authorize
{
    "type":     "authorize"
    "credentials": 
    {
        "email":      "albert@albert",
        "name":       "albert"
        "password":   "djsklfjsd=32jr?w2kjljelJ$..."
    }

}

message
{
    "type":       "message"
    "meta":
        {
            "username":   "albert",
            "time":       "12.01.2021/21:58:24",
            "topic":      "general"
        },
    "message":     "Hello there"
}
*/


/*
Serverseitige Nachrichten:

sendPrevMessages
{
    "type":       "prevMessages"
    "messages":
    [
        {
            "meta":
            {
            "username":   "albert",
            "time":       "12.01.2021/21:58:24",
            "topic":      "general"
            },
            "message":     "Hello there" 
        },
        {
            "meta":
            {
            "username":   "albert",
            "time":       "12.01.2021/21:58:24",
            "topic":      "general"
            },
            "message":     "Hello there" 
        },
        {...}, {...}
    ]

}

sendUsers
{
    "type":     "activeUsers"
    "users":    ["albert", "harald", "gustar homel"]
}

sendMessage equivalent to clients message
{
    "type":       "message"
    "meta":
        {
            "username":   "albert",
            "time":       "12.01.2021/21:58:24",
            "topic":      "general"
        },
    "message":     "Hello there"
}

*/



//Gruppe 1
//User in Gruppe 1              Nachrichten      

// ...
// ...
/*
window.onbeforeunload = function() {
    websocket.onclose = function () {}; // disable onclose handler first
    websocket.close();
};



*/


//switch(message.type){
//    case 'ping':
//        socket.send(JSON.stringify({type: 'ping', reply: 'pong'})); break;
//    case 'request':
//        socket.send(JSON.stringify({type: 'request', reply: 'response'})); break;
//    default: 
//        socket.send(JSON.stringify({type: 'error'}));        
//}
//console.log("Nachricht vom Client erhalten");
//socket.send('message');
//})


