const mongodb = require('mongodb');
const env = require('dotenv').config({ encoding: 'utf8' });

module.exports = { deleteOne, deleteMany, insertOne, insertMany, dropCollection, connectToDB, find, updateOne };

/* async function find(data, collection) {
    var res = await connectToDB(async (db) => {
        var resInner = await db.collection(collection).find(data).toArray();
        return resInner;
    });

    return res;
} */

async function find(data, collection, projection) {
    var res = await connectToDB(async (db) => {
        var resInner = await db.collection(collection).find(data).project(projection).toArray();
        return resInner;
    });

    return res;
}

async function updateOne(data, change, collection) {
    var res = await connectToDB(async (db) => {
        var resInner = await db.collection(collection).updateOne(data, change);
        return resInner;
    });

    return res;
}

function insertMany(data, collection) {
    if (data.length == 0) return;

    connectToDB(async (db) => {
        await db.collection(collection).insertMany(data);
    });
}

function insertOne(data, collection) {
    connectToDB(async (db) => {
        await db.collection(collection).insertOne(data);
    });
}

function deleteOne(data, collection) {
    connectToDB(async (db) => {
        await db.collection(collection).deleteOne(data);
    });
}

function deleteMany(data, collection) {
    if (data.length == 0) return;

    connectToDB(async (db) => {
        await db.collection(collection).deleteMany(data);
    });
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

    return res;
}

async function connectToDB(exec) {
    const mongodbClient = mongodb.MongoClient;
    const mongodbUrl = process.env.MONGO_CONNECTION_STRING;
    // 'mongodb+srv://'+env.MONGO_USERNAME+':'+env.MONGO_PASSWORD+'@env.MONGO_CONNECTION_STRING';

    var client = await mongodbClient.connect(mongodbUrl, { useUnifiedTopology: true })
    if (client == undefined) return;

    var db = client.db("ibs_ss21");
    var res = await exec(db);

    await client.close();

    return res;
}