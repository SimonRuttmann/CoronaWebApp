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

    for (var i = 0; i < data.length; i++) {
        if (data[i].ags == "08125") {
            data[i].name = "LK Heilbronn";
        } else if (data[i].ags == "08121") {
            data[i].name = "SK Heilbronn";
        } else if (data[i].ags == "08215") {
            data[i].name = "LK Karlsruhe";
        } else if (data[i].ags == "08212") {
            data[i].name = "SK Karlsruhe";
        }
    }

    if (data.length == 0) return undefined;

    await db.deleteMany({}, "agsBW");
    await db.insertMany(data, "agsBW");

    return data;
}