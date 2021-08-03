//Imports
//Needed modules express, mongoose, mysql, ejs, bcrypt, passport passport-local, session, express-flash
//Everything installable over npm i ___


const express = require('express');
const app = express();

const dataRoute = require('./routes/data.js');

//MongoCredentials should be securely handeled
var mongoUserName="myTest";
var mongoPassword="myTest";

//Middleware
app.use(express.json());
app.use('/data/',dataRoute);

//GET-Requests
app.get('/', (req,res) => {
 	res.send('Startseite');
});

//DATABASES
//Connect to Mongo
//safer implementation with dotenv -> hides creds in extra file
//ConnectionString muss angepasst werden

app.listen(3000);