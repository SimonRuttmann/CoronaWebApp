const fetch = require('node-fetch');
const db = require('./db');

module.exports = { getDataFromCSVVaccinations, getDataFromCSVVaccinationsAll }

async function getDataFromCSVVaccinationsAll(saveToDB, mqttClient) {
    console.log("get CSVVaccinationsAll");
    var data = [];

    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    var response = await fetch("https://raw.githubusercontent.com/robert-koch-institut/COVID-19-Impfungen_in_Deutschland/master/Aktuell_Deutschland_Landkreise_COVID-19-Impfungen.csv", requestOptions);
    if (response.status != 200) return undefined;

    var result = await response.text();
    var lines = result.split("\n");

    // console.log(lines.length);

    var landkreise = await db.find({}, "agsBW");

    if (landkreise.length == 0) return undefined;

    for (var i = 1; i < lines.length; i++) {
        var tmp = lines.pop();
        i--;
        var rows = tmp.split(",");

        var json = {};
        json.ags = rows[1];

        for (var j = 0; j < landkreise.length; j++) {
            if (Number(landkreise[j].ags) == Number(json.ags)) {
                json.impfdatum = rows[0];
                json.altersgruppe = rows[2];
                json.impfschutz = rows[3];
                json.anzahl = rows[4];

                data.push(json);
            }
        }
    }

    // console.log(data.length);

    if (data.length == 0) return undefined;

    if (saveToDB) {
        var oldData = await db.find({}, "vaccinationsCSVBWAll");

        if (oldData.length == 0) {
            mqttClient.publish("refresh", "vaccinationsCSVBWAll");
            await db.insertMany(data, "vaccinationsCSVBWAll");
        } else {
            for (var i = 0; i < data.length; i++) {
                var found = false;

                for (var j = 0; j < oldData.length; j++) {
                    if (data[i].ags == oldData[j].ags && data[i].altersgruppe == oldData[j].altersgruppe && data[i].impfdatum == oldData[j].impfdatum && data[i].impfschutz == oldData[j].impfschutz) {
                        found = true;

                        if (data[i].anzahl != oldData[j].anzahl) {
                            mqttClient.publish("refresh", "vaccinationsCSVBWAll");

                            await db.deleteOne({ ags: oldData[j].ags, altersgruppe: oldData[j].altersgruppe, impfdatum: oldData[j].impfdatum, impfschutz: oldData[j].impfschutz }, "vaccinationsCSVBWAll");
                            await db.insertOne(data[i], "vaccinationsCSVBWAll");
                        }
                    }
                }

                if (!found) {
                    mqttClient.publish("refresh", "vaccinationsCSVBWAll");
                    await db.insertOne(data[i], "vaccinationsCSVBWAll");
                }
            }
        }
    }

    return data;
}

async function getDataFromCSVVaccinations(saveToDB, mqttClient) {
    console.log("get CSVVaccinations");
    var data = await getDataFromCSVVaccinationsAll(false, mqttClient);

    if (data == undefined) return undefined;

    var combineData = [];

    for (var i = 0; i < data.length; i++) {
        var tmp = data.pop();
        i--;

        delete tmp.impfdatum;

        if (combineData.length == 0) {
            combineData.push(tmp);
            continue;
        }

        var found = false;
        for (var j = 0; j < combineData.length; j++) {
            if (Number(combineData[j].ags) == Number(tmp.ags) && combineData[j].altersgruppe == tmp.altersgruppe && combineData[j].impfschutz == tmp.impfschutz) {
                combineData[j].anzahl = Number(combineData[j].anzahl) + Number(tmp.anzahl);

                found = true;
                break;
            }
        }

        if (!found) combineData.push(tmp);
    }

    // console.log(combineData.length);

    if (combineData.length == 0) return undefined;

    if (saveToDB) {
        var oldData = await db.find({}, "vaccinationsCSVBWCombined");

        if (oldData.length == 0) {
            mqttClient.publish("refresh", "vaccinationsCSVBWCombined");
            await db.insertMany(combineData, "vaccinationsCSVBWCombined");
        } else {
            for (var i = 0; i < combineData.length; i++) {
                var found = false;

                for (var j = 0; j < oldData.length; j++) {
                    if (combineData[i].ags == oldData[j].ags && combineData[i].altersgruppe == oldData[j].altersgruppe && combineData[i].impfschutz == oldData[j].impfschutz) {
                        found = true;

                        if (combineData[i].anzahl != oldData[j].anzahl) {
                            mqttClient.publish("refresh", "vaccinationsCSVBWCombined");

                            await db.deleteOne({ ags: oldData[j].ags, altersgruppe: oldData[j].altersgruppe, impfdatum: oldData[j].impfdatum, impfschutz: oldData[j].impfschutz }, "vaccinationsCSVBWCombined");
                            await db.insertOne(combineData[i], "vaccinationsCSVBWCombined");
                        }
                    }
                }

                if (!found) {
                    mqttClient.publish("refresh", "vaccinationsCSVBWCombined");
                    await db.insertOne(combineData[i], "vaccinationsCSVBWCombined");
                }
            }
        }
    }

    return combineData;
}