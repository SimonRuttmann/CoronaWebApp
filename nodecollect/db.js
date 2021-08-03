const mongodb = require('mongodb');

module.exports = { deleteOne, deleteMany, insertOne, insertMany, dropCollection, connectToDB, find };

async function find(data, collection) {
    var res = await connectToDB(async (db) => {
        var resInner = await db.collection(collection).find(data).toArray();
        return resInner;
    });

    console.log("Find Data");

    return res;
}

function insertMany(data, collection) {
    if (data.length == 0) return;

    connectToDB(async (db) => {
        await db.collection(collection).insertMany(data);
    });

    console.log("Insert Data");
}

function insertOne(data, collection) {
    connectToDB(async (db) => {
        await db.collection(collection).insertOne(data);
    });

    console.log("Insert Data");
}

function deleteOne(data, collection) {
    connectToDB(async (db) => {
        await db.collection(collection).deleteOne(data);
    });

    console.log("Delete Data");
}

function deleteMany(data, collection) {
    if (data.length == 0) return;

    connectToDB(async (db) => {
        await db.collection(collection).deleteMany(data);
    });

    console.log("Delete Data");
}

function dropCollection(collection) {
    var res = connectToDB(async (db) => {
        var collections = await db.listCollections().toArray();

        var found = false;
        for (var i = 0; i < collections.length; i++) {
            if (collections[i].name == collection) {
                found = true;
                break;
            }
        }

        if (found) await db.dropCollection(collection);

        return found;
    });

    console.log("Drop Collection");

    return res;
}

async function connectToDB(exec) {
    const mongodbClient = mongodb.MongoClient;
    const mongodbUrl = "mongodb://mongodb:27017";

    var client = await mongodbClient.connect(mongodbUrl, { useUnifiedTopology: true })
    if (client == undefined) return;

    var db = await client.db("ibs_ss21");
    var res = await exec(db);

    await client.close();

    console.log("Connect to DB");

    return res;
}