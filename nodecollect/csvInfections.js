const fetch = require('node-fetch');
const db = require('./db');

module.exports = { getDataFromCSVInfections, saveHistoryCSVInfections }

async function getDataFromCSVInfections(saveToDB, mqttClient) {
    var data = [];

    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    var response = await fetch("https://media.githubusercontent.com/media/robert-koch-institut/SARS-CoV-2_Infektionen_in_Deutschland/master/Aktuell_Deutschland_SarsCov2_Infektionen.csv", requestOptions);
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
        json.ags = rows[0];

        for (var j = 0; j < landkreise.length; j++) {
            if (Number(landkreise[j].ags) == Number(json.ags)) {
                json.altersgruppe = rows[1];
                json.geschlecht = rows[2];
                // json.meldedatum = rows[3];
                // json.refdatum = rows[4];
                // json.isterkrankungsbeginn = rows[5];
                // json.neuerfall = rows[6];
                // json.neuertodesfall = rows[7];
                // json.neugenesen = rows[8];
                json.anzahlfall = rows[9];
                json.anzahltodesfall = rows[10];
                json.anzahlgenesen = rows[11].substr(0, rows[11].indexOf("\r"));

                data.push(json);
            }
        }
    }

    // console.log(data.length);

    var combineData = [];

    for (var i = 0; i < data.length; i++) {
        var tmp = data.pop();
        i--;

        if (combineData.length == 0) {
            combineData.push(tmp);

            combineData[0].anzahlfall = [combineData[0].anzahlfall];
            combineData[0].anzahltodesfall = [combineData[0].anzahltodesfall];
            combineData[0].anzahlgenesen = [combineData[0].anzahlgenesen];
            continue;
        }

        var found = false;
        for (var j = 0; j < combineData.length; j++) {
            if (Number(combineData[j].ags) == Number(tmp.ags) && combineData[j].altersgruppe == tmp.altersgruppe && combineData[j].geschlecht == tmp.geschlecht) {
                combineData[j].anzahlfall.push(tmp.anzahlfall);
                combineData[j].anzahltodesfall.push(tmp.anzahltodesfall);
                combineData[j].anzahlgenesen.push(tmp.anzahlgenesen);

                found = true;
                break;
            }
        }

        if (!found) {
            combineData.push(tmp);

            combineData[combineData.length - 1].anzahlfall = [combineData[combineData.length - 1].anzahlfall];
            combineData[combineData.length - 1].anzahltodesfall = [combineData[combineData.length - 1].anzahltodesfall];
            combineData[combineData.length - 1].anzahlgenesen = [combineData[combineData.length - 1].anzahlgenesen];
        }
    }

    // console.log(combineData.length);

    var calculateData = [];

    for (var i = 0; i < combineData.length; i++) {
        var tmp = combineData.pop();
        i--;

        var json = {};
        json.ags = tmp.ags;
        json.altersgruppe = tmp.altersgruppe;
        json.geschlecht = tmp.geschlecht;

        var sumAnzahlFall = 0;
        for (var j = 0; j < tmp.anzahlfall.length; j++) {
            sumAnzahlFall = sumAnzahlFall + Number(tmp.anzahlfall[j]);
        }

        var schnittSumAnzahlFall = sumAnzahlFall / tmp.anzahlfall.length;

        var sumAnzahlTodesFall = 0;
        for (var j = 0; j < tmp.anzahltodesfall.length; j++) {
            sumAnzahlTodesFall = sumAnzahlTodesFall + Number(tmp.anzahltodesfall[j]);
        }

        var schnittSumAnzahlTodesFall = sumAnzahlTodesFall / tmp.anzahltodesfall.length;

        var sumAnzahlGenesen = 0;
        for (var j = 0; j < tmp.anzahlgenesen.length; j++) {
            sumAnzahlGenesen = sumAnzahlGenesen + Number(tmp.anzahlgenesen[j]);
        }

        var schnittSumAnzahlGenesen = sumAnzahlGenesen / tmp.anzahlgenesen.length;

        json.anzahlfall = sumAnzahlFall;
        json.anzahltodesfall = sumAnzahlTodesFall;
        json.anzahlgenesen = sumAnzahlGenesen;
        json.schnittanzahlfall = schnittSumAnzahlFall;
        json.schnitttodesfall = schnittSumAnzahlTodesFall;
        json.schnittanzahlgenesen = schnittSumAnzahlGenesen;
        json.date = Date.now();

        calculateData.push(json);
    }

    // console.log(calculateData.length);

    if (saveToDB) {
        var oldData = await db.find({}, "infectionsCSVBW");

        if (oldData.length == 0) {
            mqttClient.publish("refresh", "infectionsCSVBW");
            await db.insertMany(calculateData, "infectionsCSVBW");
        } else {
            for (var i = 0; i < calculateData.length; i++) {
                var found = false;

                for (var j = 0; j < oldData.length; j++) {
                    if (calculateData[i].ags == oldData[j].ags && calculateData[i].altersgruppe == oldData[j].altersgruppe && calculateData[i].geschlecht == oldData[j].geschlecht) {
                        found = true;

                        if (calculateData[i].anzahlfall != oldData[j].anzahlfall || calculateData[i].anzahltodesfall != oldData[j].anzahltodesfall || calculateData[i].anzahlgenesen != oldData[j].anzahlgenesen) {
                            mqttClient.publish("refresh", "infectionsCSVBW");

                            await db.deleteOne({ ags: oldData[j].ags, altersgruppe: oldData[j].altersgruppe, geschlecht: oldData[j].geschlecht }, "infectionsCSVBW");
                            await db.insertOne(calculateData[i], "infectionsCSVBW");
                        }
                    }
                }

                if (!found) {
                    mqttClient.publish("refresh", "infectionsCSVBW");
                    await db.insertOne(calculateData[i], "infectionsCSVBW");
                }
            }
        }
    }

    return calculateData;
}

async function saveHistoryCSVInfections() {
    var data = await getDataFromCSVInfections(false);
    var history = await db.find({}, "historyinfectionsCSVBW");

    if (data == undefined) return undefined;
    if (history == undefined) history = [];

    for (var i = 0; i < data.length; i++) {
        var found = false;
        for (var j = 0; j < history.length; j++) {
            if (data[i].ags == history[j].ags && data[i].altersgruppe == history[j].altersgruppe && data[i].geschlecht == history[j].geschlecht) {
                found = true;

                history[j].anzahlfall.push(data[i].anzahlfall);
                history[j].anzahltodesfall.push(data[i].anzahltodesfall);
                history[j].anzahlgenesen.push(data[i].anzahlgenesen);
            }
        }

        if (!found) {
            var tmp = data[i];

            tmp.anzahlfall = [data[i].anzahlfall];
            tmp.anzahltodesfall = [data[i].anzahltodesfall];
            tmp.anzahlgenesen = [data[i].anzahlgenesen];

            history.push(tmp);
        }
    }

    await db.dropCollection("historyinfectionsCSVBW");
    await db.insertMany(history, "historyinfectionsCSVBW");
}