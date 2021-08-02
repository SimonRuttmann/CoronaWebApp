/*
The mySql schema consists only of one table, 
email and id are used by authentification
name is used for the chat over websockets
the remaining are used for the vaccination search

    id              VARCHAR(255),
    name            VARCHAR(255) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    gender          ENUM('unkown', 'male', 'female', 'diverse')     DEFAULT 'unknown', 
    prioritiy       VARCHAR(30)                                     DEFAULT 'priority4',
    prefVaccine     VARCHAR(50)                                     DEFAULT 'everything',
    district        VARCHAR(255)                                    DEFAULT 'unkown',
    radius          ENUM('all', 'surr', 'one')                      DEFAULT 'all',   
    PRIMARY KEY (id)
);
*/

const mysql = require('mysql');

//DB-Connection
var mysqlPool = mysql.createPool({
    connectionLimit: 10,
    host: "sql11.freemysqlhosting.net",
    user: "sql11428172",
    password: "E6Yk3KiNmZ",
    database: "sql11428172"
});

//createAccountTable();


exports.getAllUserData = 
function getAllUserData(selectQuery){
    console.log("Select query:")
    console.log(selectQuery)

    return new Promise( (resolve, reject) => {
        
        var user;
        console.log("D1")
            mysqlPool.query(selectQuery, function (err, resultrows, fields) {
                console.log("tt")
                console.log(resultrows)
                console.log(err)
                if (err){ 
                    console.log("t")
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
                        gender: resultrows[0].gender,
                        priority: resultrows[0].priority,
                        prefVaccine: resultrows[0].prefVaccine,
                        district: resultrows[0].district,
                        radius: resultrows[0].radius
                    };
                    console.log("D2")
                    resolve(user);
                }
            });
        
    })
}


exports.insertUser =
function insertUser(user){
   
    var insertQuery = 
    `INSERT INTO Account(id, name, email, password) VALUES ("${user.id}", "${user.name}", "${user.email}", "${user.password}");`;

    try{
        mysqlPool.query(insertQuery, function(error, resultrows, fields){
            console.log("insertUser -> InsertStatement bei insertQuery: " + insertQuery)
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


exports.createAccountTable = 
function createAccountTable(){
    var tableQuery = 
    `CREATE TABLE IF NOT EXISTS Account (                                                  
        id          VARCHAR(255),
        name        VARCHAR(255) NOT NULL UNIQUE,
        email       VARCHAR(255) NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        gender      ENUM('unknown', 'male', 'female', 'diverse')  DEFAULT 'unknown', 
        prioritiy    VARCHAR(30)  DEFAULT 'priority4',
        prefVaccine VARCHAR(50)  DEFAULT 'everything',
        district    VARCHAR(255) DEFAULT 'unkown',
        radius      ENUM('all', 'surr', 'one')  DEFAULT 'all',   
        PRIMARY KEY (id)
    )`
    mysqlPool.query(tableQuery);
  }
  
