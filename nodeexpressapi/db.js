const mongodb = require('mongodb');
const env = require('dotenv').config({encoding:'utf8'});

module.exports = {find,updateOne};

async function find(data, collection) {
    var res = await connectToDB(async (db) => {
        var resInner = await db.collection(collection).find(data).toArray();
        return resInner;
    });

    return res;
}
async function find(data,collection,projection){
    var res = await connectToDB(async (db) => {
        var resInner = await db.collection(collection).find(data).project(projection).toArray();
        return resInner;
    });
    return res;
}

async function updateOne(data,change,collection){
    var res = await connectToDB(async (db) => {
        var resInner = await db.collection(collection).updateOne(data,change);
        return resInner;
    });
    return res;
}

async function connectToDB(exec) {
    const mongodbClient = mongodb.MongoClient;
    const mongodbUrl= process.env.MONGO_CONNECTION_STRING;
    // 'mongodb+srv://'+env.MONGO_USERNAME+':'+env.MONGO_PASSWORD+'@env.MONGO_CONNECTION_STRING';

    var client = await mongodbClient.connect(mongodbUrl, { useUnifiedTopology: true })
    if (client == undefined) return;
    
    var db = await client.db("ibs_ss21");

    
    var res = await exec(db);
	await client.close();
    //console.log("Connect to DB");

    return res;
    }