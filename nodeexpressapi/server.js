const express = require('express')
const flash = require('express-flash')               //Used to display messages, if we fail to login. (wrong password, wrong email)
const expresssession = require('express-session')    //Stores and persists session across different pages
const passport = require('passport')
const routes = require("./routes.js")
const authentificationSetup = require("./authentificationSetup");
const dataRoute = require("./routes/data.js")

console.log("test1")

console.log("test")
const app = express()
const env = require('dotenv').config({ encoding: 'utf8' });
var mysql = require('mysql2');

// This order must be ensured
//1. passport Strategy
//2. Express-Session        (after strategy)
//3. view-engine
//4. flash                  (after view-engine )
//5. passport initialize    (after express session and flash)
//6. passport session       (after passport initialize)
//7. routes                 (after passport configs and view-engine)

//Necesarry for correct interpretation of body 
app.use(express.urlencoded({ extended: false }))
app.use(express.json());

app.use(express.static('public'));                
app.use(express.static(__dirname + '/public'));
//exports.initializeWebsocketServer = 
//wsServer.initializeWebsocketServer()
//wsServer.getServer(app);


//Configuration for passport & sessions

authentificationSetup.initializePassport(passport);

//Sessionconfigs, to only create sessions 
//if the sessionobject was modified 
//(session will only created at log-in)
app.use(expresssession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false    
    }))

app.set('view-engine', 'ejs'); 
app.use(flash());              
app.use(passport.initialize());
app.use(passport.session());
app.use("", routes);
app.use('/data/',dataRoute);
  
const server = app.listen(6969, () => {
   console.log("Server listens at Port 6969")
})

exports.getServer = 
function getServer (){
    return server;
}
const wsServer = require("./wsServer/websocketServer.js")