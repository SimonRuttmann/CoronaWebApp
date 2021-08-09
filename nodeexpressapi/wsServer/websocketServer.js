//const http = require('http');
//const express = require('express');
const ws = require('ws');
const main = require("../server.js");


const server = main.getServer()

const wsServer = new ws.Server({server}) //{server}
const env = require('dotenv').config({path: '../.env', encoding:'utf8'});

//<---------- Configuration ------------>//

//MongoDb
const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_CONNECTION_STRING;
const ourDb = "ibs_ss21";
const client = new MongoClient(uri);


//MySql-Pool
const mysql = require('mysql2');
var mysqlPool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
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

async function createMongoTTL(){
    
    try{
     
        await client.connect();
     
        const database = client.db(ourDb);
       
        const chatColl = await database.collection("chat").createIndex({"createdAt":1},{expireAfterSeconds: 86400});
    
       console.log("Created TTL");
    }
    finally{
        await client.close();
    }
}
createMongoTTL();
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
    
    var previousMessages = {};
    previousMessages.type = servertypes.PREVMESSAGES;
    previousMessages.messages = mongoresult;
    return previousMessages;
}

function getPreviousMessagesFromMongo(topic){
    return new Promise( async(resolve, reject) => {

        try{
            result = await runMongo(async coll => {
            
                const query = {"meta.topic": `${topic}`};
                const projection = {_id: 0};
                
                return await coll.find(query).project(projection).toArray();
            })

            resolve(result);
        }
        catch(e){
            reject(e);
        }
    });
}



async function saveMessageInMongo(message){
    var doc = message;
    //const doc =  {
    //    title: "Record of a Shriveled Datum",
    //    content: "No bytes, no problem. Just insert a document, in MongoDB",
    //  }
   
   // doc = JSON.parse(doc);
    doc.createdAt = new Date();
    //doc = JSON.stringify(doc);
    return new Promise( async(resolve, reject) => {

        try{
            result = await runMongo(    async coll => {
                        return await coll.insertOne(doc);
                    })

            resolve(result);
        }
        catch(e){
            reject(e);
        }
    });
}

//<------------------ Helpfunctions ----------------------->//




async function checkAuthorized(email, password){
    passwordSql = await getPwFromMySql(email);
    if(passwordSql){ 
        return password == passwordSql;
    }
}



function notifyActiveTopicUsers(message,topic){
    console.log("notifyActive")
    wsServer.clients.forEach( socket => {
        if(socket.readyState == ws.OPEN && socket.topic == topic){
            console.log("notify active topic user")
            socket.send(message);
        }
    })
}

function notifyAuthTopicUsers(message, topic){
    console.log("auth. Notify")
   
    wsServer.clients.forEach( socket => {
        if(socket.readyState == ws.OPEN && socket.authorize && socket.topic == topic){
            console.log("notify authenticated user")
            console.log("socket.topic " + socket.topic);
            console.log("topic" + topic)
            socket.send(message);
        }
    })
}



function createSendUserResponse(topic){
    var usernamesByTopic = [];

    wsServer.clients.forEach( socket => {
        if(socket.readyState == ws.OPEN && socket.topic == topic && socket.authorize){
            usernamesByTopic.push(socket.name)
        }

            
    })
    usernamesByTopic.sort( (val1, val2) => {
        if(val1 < val2) return -1;
        if(val2 < val1) return 1;
        return 0;
    })
    var userResponse = {
        type: servertypes.ACTIVEUSERS,
        users: usernamesByTopic
    }
    console.log("SendUsersResponse an topic: " + topic);
   
    console.log(JSON.stringify(userResponse))
    console.log("users:")
    console.log(userResponse.users)
    return JSON.stringify(userResponse);

}


//<------------------ Logic ----------------------->//

wsServer.on('connection', socket => {
    console.log("Client hat Verbinung zum Websocket Server hergestellt");
    wsServer.clients.forEach(socket => console.log("Socket"));
    socket.topic = topics.GENERAL;
    socket.authorize = false;
    socket.on('message', async data => {
        const receivedMessage = JSON.parse(data);
        console.log("geparstes Json:")
        console.log(receivedMessage)
        switch(receivedMessage.type){
            case clienttypes.AUTHORIZE:

                    let email = receivedMessage.credentials.email;
                    let pw = receivedMessage.credentials.password; 
                
                    if(checkAuthorized(email, pw)){ 
                        socket.authorize = true;
                        socket.name=receivedMessage.credentials.name;
                      //  notifyAuthTopicUsers(createSendUserResponse(socket.topic), socket.topic)    
                    }
                    //socket.send(JSON.stringify(await createPreviousMessages(socket.topic)))
                    break;

            case clienttypes.TOPIC:

                    let previousTopic = socket.topic;
                    socket.topic = receivedMessage.topic;
                    socket.send(JSON.stringify(await createPreviousMessages(socket.topic)))

                    //Wenn authorisiert 1. Aus dem Alten topic entfernen, 2. Aus dem neuen topic hinzufügen
                    if(socket.authorize){
                        if(socket.topic != previousTopic){
                            notifyAuthTopicUsers(createSendUserResponse(previousTopic), previousTopic);
                        }
                        notifyAuthTopicUsers(createSendUserResponse(socket.topic), socket.topic);
                    }
                    break;

            case clienttypes.MESSAGE:
                    
                    if(socket.authorize){
                        saveMessageInMongo(receivedMessage)
                        notifyActiveTopicUsers(JSON.stringify(receivedMessage), socket.topic);
                    }
                    break;

            default: console.log("Unknown type received: " + receivedMessage.type);
        }
    })
    socket.on('close', async ()=> {
        notifyAuthTopicUsers(createSendUserResponse(socket.topic), socket.topic);
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

