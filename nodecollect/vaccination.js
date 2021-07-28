const fetch = require('node-fetch');
const db = require('./db');
const fs = require('fs');

module.exports = { getVaccinationPlaces, getVaccinationDates };

async function getVaccinationPlaces(saveToDB) {
    var data = [];

    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    var response = await fetch("https://impfterminradar.de/api/centers/all", requestOptions);
    if (response.status != 200) return undefined;

    var result = await response.text();
    var json = JSON.parse(result);

    for (var i = 0; i < json.length; i++) {
        if (json[i].BundeslandRealName == "Baden-Württemberg") {
            data.push(json[i]);

            delete data[data.length - 1].Bundesland;
            delete data[data.length - 1].Domain;
            delete data[data.length - 1].Typee;
        }
    }

    if (saveToDB) {
        await db.dropCollection("vaccinationPlacesBW");
        await db.insertMany(data, "vaccinationPlacesBW");
    }

    return data;
}

async function getVaccinationDates() {
    var data = [];
    var places = await getVaccinationPlaces(false);

    var jsonData = await fs.readFileSync("./raw.json", "utf8");
    var raw = JSON.parse(JSON.stringify(jsonData));

    var requestOptions = {
        method: 'PATCH',
        headers: {
            "Content-Type": "application/json"
        },
        body: raw,
        redirect: 'follow'
    };

    var response = await fetch("https://impfterminradar.de/api/vaccinations/availability", requestOptions);
    var result = await response.text();

    var json = JSON.parse(result);

    for (var i = 0; i < json.length; i++) {
        for (var j = 0; j < places.length; j++) {
            if (json[i].Slug.includes(places[j].Slug) && json[i].Slug != places[j].Slug && places[j].BundeslandRealName == "Baden-Württemberg") {
                data.push(json[i]);

                delete data[data.length - 1].Unknown;
                delete data[data.length - 1].WaitingRoom;
            }
        }
    }

    await db.dropCollection("vaccinationDatesBW");
    await db.insertMany(data, "vaccinationDatesBW");
}