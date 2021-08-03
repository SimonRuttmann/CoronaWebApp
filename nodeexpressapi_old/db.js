const mongodb = require('mongodb');

module.exports = {insertOne,find};

var mongoUserName="root";
var mongoPassword="rootpassword";

async function find(data, collection) {
    var res = await connectToDB(async (db) => {
        var resInner = await db.collection(collection).find(data).toArray();
        return resInner;
    });

    //console.log("Find Data");

    return res;
}
async function find(data,collection,projection){
    var res = await connectToDB(async (db) => {
        var resInner = await db.collection(collection).find(data).project(projection).toArray();
        return resInner;
    });

    //console.log("Find Data");

    return res;
}

function insertOne(data, collection) {
    connectToDB(async (db) => {
        await db.collection(collection).insertOne(data);
    });

    //console.log("Insert Data");
}

async function connectToDB(exec) {
    const mongodbClient = mongodb.MongoClient;
    const mongodbUrl= "mongodb://localhost:27017"
    // 'mongodb+srv://'+mongoUserName+':'+mongoPassword+'@modernedatentechnologie.rfnxd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

    var client = await mongodbClient.connect(mongodbUrl, { useUnifiedTopology: true })
    if (client == undefined) return;

    var db = await client.db("ibs_ss21");
    //var res = await exec(db);

    
    var res = await exec(db);
	await client.close();
    //console.log("Connect to DB");

    return res;
    }