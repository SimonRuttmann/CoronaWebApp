const http = require('http');
const express = require('express');
const ws = require('ws');

const app = express();
const server = http.createServer(app);
const wsServer = new ws.Server(server) //{server}
const env = require('dotenv').config({path: '../.env', encoding:'utf8'});

//<---------- Configuration ------------>//

//MongoDb
const { MongoClient } = require("mongodb");
const uri = env.MONGO_CONNECTION_STRING;
const ourDb = "ibs_ss21";
const client = new MongoClient(uri);


//MySql-Pool
const mysql = require('mysql');
var mysqlPool = mysql.createPool({
    connectionLimit: 10,
    host: env.MYSQL_HOST,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE
});


//<------------- Constants ---------------->//
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



//<----------------- My Sql ------------------>//

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



//<----------------- Mongo Db ------------------>//

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

//<------------------ Helpfunctions ----------------------->//



app.get('/',(req,res)=> {
    res.send('Hallo über HTTP');
});




async function checkAuthorized(email, password){
    passwordSql = await getPwFromMySql(email);
    if(passwordSql){ 
        return password == passwordSql;
    }
}



function notifyActiveTopicUsers(message,topic){
    wsServer.clients.forEach( socket => {
        if(client.readyState == ws.OPEN && socket.topic == topic)
            socket.send(message);
    })
}

function notifyAuthTopicUsers(message, topic){
    wsServer.clients.forEach( socket => {
        if(client.readyState == ws.OPEN && socket.authorize && socket.topic == topic)
            socket.send(message);
    })
}



function createSendUserResponse(topic){
    var usernamesByTopic = [];

    wsServer.clients.forEach( socket => {
        if(client.readyState == ws.OPEN && socket.topic == topic)
            usersByTopic.push(topic.name)
    })

    var userResponse = {
        type: servertypes.activeUsers,
        users: usernamesByTopic
    }
    return JSON.stringify(userResponse);

}


//<------------------ Logic ----------------------->//

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
                        notifyAuthTopicUsers(createSendUserResponse(socket.topic), socket.topic)    
                    }
                    break;

            case clienttypes.TOPIC:

                    let previousTopic = receivedMessage.topic;
                    socket.topic = receivedMessage.topic;
                    socket.send(JSON.stringify(await createPreviousMessages(socket.topic)))

                    //Wenn authorisiert 1. Aus dem Alten topic entfernen, 2. Aus dem neuen topic hinzufügen
                    if(socket.authorize){
                        notifyAuthTopicUsers(createSendUserResponse(previousTopic), socket.topic);
                        notifyAuthTopicUsers(createSendUserResponse(socket.topic), socket.topic);
                    }
                    break;

            case clienttypes.MESSAGE:
                    
                    if(socket.authorize){
                        saveMessageInMongo(receivedMessage);
                        notifyActiveTopicUsers(JSON.stringify(receivedMessage), socket.topic);
                    }
                    break;

            default: console.log("Unknown type received: " + receivedMessage.type);
        }
    })
});

//Chrome-Browser BuildIn WebSockets
//socket = new WebSocket('ws://localhost:3000')
//socket.onmessage = function(message){ console.log(message)}
//socket.send("Hallo vom Client")

//Possible Heartbeat
/*
setInterval( () => {
    wsServer.clients.forEach(client => {
        if(client.readyState !== ws.OPEN){
            return; //Returned anonyme funktion
        }
        client.send(JSON.stringify({type: 'heartbeat'}));
    });

}, 10000)
*/

server.listen(3000, () => {
    console.log("Server is running on Port 3000")
})

