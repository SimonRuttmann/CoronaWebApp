/*
The mySql schema consists only of one table, 
email and id are used by authentification
name is used for the chat over websockets
the remaining are used for the vaccination search

  
CREATE TABLE IF NOT EXISTS Account (
    id          VARCHAR(255),
    name        VARCHAR(255) NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    biontech    BOOLEAN,
    moderna     BOOLEAN,
    astra       BOOLEAN,
    johnson     BOOLEAN,
    latitude    VARCHAR(40) DEFAULT '0',
    longitude   VARCHAR(40) DEFAULT '0',
    city        VARCHAR(255) DEFAULT 'none',
    radius      INTEGER,   
    PRIMARY KEY (id)
);

*/

const mysql = require('mysql2');
const env = require('dotenv').config({ encoding:'utf8'});



//One-Time Connection to create database and tables, 
//afterwards pooling connections are initialized with the database
 var createDBandTableCon = mysql.createConnection({
     host: process.env.MYSQL_HOST,
     user: process.env.MYSQL_USER,
     password: process.env.MYSQL_PASSWORD
   });
  

async function initDB (){
    await createDatabase();
    var worked = await changeUser();
    if(worked) {
        await createAccountTable();
    }
    
};


initDB();
  

//Creating DB-Pool 
var mysqlPool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});






exports.getAllUserData = 
function getAllUserData(selectQuery){
   
    return new Promise( (resolve, reject) => {
        
        var user;
      
            mysqlPool.query(selectQuery, function (err, resultrows, fields) {
    
                if (err){ 
                    reject(err);
                }
                else if (resultrows.length == 0){
                    resolve(null);
                }
                else{     
                    user = {
                        valid: true,
                        name: resultrows[0].name,
                        email: resultrows[0].email,
                        biontech: resultrows[0].biontech,
                        moderna: resultrows[0].moderna,
                        astra: resultrows[0].astra,
                        johnson: resultrows[0].johnson,
                        latitude: resultrows[0].latitude,
                        longitude: resultrows[0].longitude,
                        city: resultrows[0].city,
                        radius: resultrows[0].radius
                    };
                    
                    resolve(user);
                }
            });
        
    })
}

//Used for registration
exports.insertUser =
function insertUser(user){
   
    var insertQuery = 
    `INSERT INTO Account(id, name, email, password) VALUES ("${user.id}", "${user.name}", "${user.email}", "${user.password}");`;

    try{
        mysqlPool.query(insertQuery, function(error, resultrows, fields){
            console.log("Registered new user, insertQuery: " + insertQuery)
        });
    }
    catch(e){
        console.log("Error at inserting User: " + user);
        console.log(e);
    }
  }


exports.updateUserByStatement =
function  updateUserByStatement(updateQuery){
        
    return new Promise( ( resolve, reject) => {
        mysqlPool.query(updateQuery, function(err, resultrows, fields){
            if(err){
                reject(err);
            }
            else if(resultrows.length == 0){
                resolve(false)
            }
            else{
                resolve(true)
            }
        });
    });
}

// Used by the authentification system
exports.getUserDataForSession =
function getUserDataForSession(selectQuery){

    return new Promise( (resolve, reject) => {
        
        var user;
        
            mysqlPool.query(selectQuery, function (err, resultrows, fields) {
                if (err){ 
                    reject(err);
                }
                else if (resultrows.length == 0){
                    resolve(null);
                }
                else{     
                    user = {
                        id: resultrows[0].id,
                        name: resultrows[0].name,
                        email: resultrows[0].email,
                        password: resultrows[0].password
                    };
                    resolve(user);
                }
            });
        
    })
}



/*             DB-Initialize                 */

function createDatabase(){
    var createDBQuery = 
    `CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE};`;
    console.log(createDBQuery);
    return new Promise( (resolve,reject) => {
        createDBandTableCon.query(createDBQuery, (err, resultrows, fields) => {
            if (err){      
                reject(false);
            }
      
            else{    
                resolve(true);
            }
        });
    }) 
  }
  

  

function changeUser(){
    return new Promise((resolve, reject) => {
        createDBandTableCon.changeUser({database: process.env.MYSQL_DATABASE}, function(err) {
            if (err){ 
                reject(false)
            }
            else{
                resolve(true)
            }
            
        })
    })
}

function createAccountTable(){
    var tableQuery = 
    `CREATE TABLE IF NOT EXISTS Account (
        id          VARCHAR(255),
        name        VARCHAR(255) NOT NULL UNIQUE,
        email       VARCHAR(255) NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        biontech    BOOLEAN,
        moderna     BOOLEAN,
        astra       BOOLEAN,
        johnson     BOOLEAN,
        latitude    VARCHAR(40) DEFAULT '0',
        longitude   VARCHAR(40) DEFAULT '0',
        city        VARCHAR(255) DEFAULT 'none',
        radius      INTEGER,   
        PRIMARY KEY (id)
    );`
    return new Promise( (resolve,reject) => {
        createDBandTableCon.query(tableQuery, (err, resultrows, fields) => {
            if (err){ 
                createDBandTableCon.release();
                reject(false);
            }
            else if (resultrows.length == 0){
                createDBandTableCon.release();
                resolve(true);
            }
        });
    }) 
  }
