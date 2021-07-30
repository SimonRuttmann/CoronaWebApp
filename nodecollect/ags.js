const fetch = require('node-fetch');
const db = require('./db');

module.exports = { getAGSBW }

async function getAGSBW() {
    var data = [];

    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    var response = await fetch("https://api.corona-zahlen.org/districts/", requestOptions);
    if (response.status != 200) return false;

    var result = await response.text();
    var json = JSON.parse(result);

    for (var districtID in json.data) {
        if (json.data[districtID].state == "Baden-Württemberg") {
            var landkreis = {};
            landkreis.name = json.data[districtID].name;
            landkreis.ags = json.data[districtID].ags;

            data.push(landkreis);
        }
    }

    if (data.length == 0) return false;

    await db.deleteMany({}, "agsBW");
    await db.insertMany(data, "agsBW");

    return true;
}