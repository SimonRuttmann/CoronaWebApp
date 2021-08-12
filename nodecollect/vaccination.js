const fetch = require('node-fetch');
const fs = require('fs');
const db = require('./db');
const geocode = require('../nodeexpressapi/routes/geocoding');

module.exports = { getVaccinationPlaces, getVaccinationDates, saveHistoryPlaces, saveHistoryDates };

async function getVaccinationPlaces(saveToDB, mqttClient) {
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

    if (data.length == 0) return undefined;

    for (var i = 0; i < data.length; i++) {
        if (data[i].Adress.includes("  ")) {
            data[i].Adress = data[i].Adress.replace("  ", " ");
        } else if (!data[i].Adress.includes(" ") && data[i].Adress.length > 0) {
            var index = -1;
            for (var j = 0; j < data[i].Adress.length; j++) {
                if (!isNaN(Number(data[i].Adress[j]))) {
                    index = j;
                    break;
                }
            }

            if (index != -1) {
                data[i].Adress = data[i].Adress.substring(0, index) + " " + data[i].Adress.substring(index, data[i].Adress.length);
            }
        }
    }

    if (saveToDB) {
        var oldData = await db.find({}, "vaccinationPlacesBW");

        for (var i = 0; i < data.length; i++) {
            var found = false;
            for (var j = 0; j < oldData.length; j++) {
                if (oldData[j].Slug == data[i].Slug) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                await db.insertOne(data[i]);
                mqttClient.publish("refresh", "vaccinationPlacesBW");
            }
        }

        geocode.calcGeocodeForCompleteDB();
    }

    return data;
}

async function getVaccinationDates(saveToDB, mqttClient) {
    var data = [];
    var places = await getVaccinationPlaces(false);

    if (places == undefined) return undefined;

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

    if (data.length == 0) return undefined;

    if (saveToDB) {
        var oldData = await db.find({}, "vaccinationDatesBW");

        if (oldData.length == 0) {
            mqttClient.publish("refresh", "vaccinationDatesBW");
            await db.insertMany(data, "vaccinationDatesBW");
        } else {
            for (var i = 0; i < data.length; i++) {
                var found = false;

                for (var j = 0; j < oldData.length; j++) {
                    if (data[i].Slug == oldData[j].Slug) {
                        found = true;

                        if (data[i].Available != oldData[j].Available || data[i].NoBooking != oldData[j].NoBooking) {
                            mqttClient.publish("refresh", "vaccinationDatesBW");

                            await db.deleteOne({ Slug: oldData[j].Slug }, "vaccinationDatesBW");
                            await db.insertOne(data[i], "vaccinationDatesBW");
                        }
                    }
                }

                if (!found) {
                    mqttClient.publish("refresh", "vaccinationDatesBW");
                    await db.insertOne(data[i], "vaccinationDatesBW");
                }
            }
        }
    }

    return data;
}

async function saveHistoryPlaces() {
    var data = await getVaccinationPlaces(false);
    var places = [];

    if (data == undefined) return undefined;

    for (var i = 0; i < data.length; i++) {
        places.push(data[i].Slug);
    }

    var save = {};
    save.date = Date.now();
    save.places = places;
    save.data = data;

    await db.insertOne(save, "historyVaccinationPlacesBW");

    return ["run", "successful"];
}

async function saveHistoryDates() {
    var data = await getVaccinationDates(false);
    var history = await db.find({}, "historyVaccinationDatesBW");

    if (data == undefined) return undefined;
    if (history == undefined) history = [];

    for (var i = 0; i < data.length; i++) {
        var found = false;
        for (var j = 0; j < history.length; j++) {
            if (data[i].Slug == history[j].Slug) {
                found = true;

                history[j].Available.push(data[i].Available);
                history[j].NoBooking.push(data[i].NoBooking);
                history[j].Time.push(data[i].Time);
            }
        }

        if (!found) {
            var tmp = data[i];

            tmp.Available = [data[i].Available];
            tmp.NoBooking = [data[i].NoBooking];
            tmp.Time = [data[i].Time];

            history.push(tmp);
        }
    }

    if (history.length == 0) return undefined;

    await db.dropCollection("historyVaccinationDatesBW");
    await db.insertMany(history, "historyVaccinationDatesBW");

    return history;
}