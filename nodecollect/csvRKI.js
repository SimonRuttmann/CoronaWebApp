const fetch = require('node-fetch');
const db = require('./db');

module.exports = { getDataCombined }

async function getCasesHistory() {
    console.log("get CasesHistory");
    var data = [];

    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    var response = await fetch("https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/cases-rki-by-ags.csv", requestOptions);
    if (response.status != 200) return undefined;

    var result = await response.text();
    var lines = result.split("\n");

    var landkreise = await db.find({}, "agsBW");
    var listCSVBWIndexes = [];
    var firstRow = lines[0].split(",");

    for (var i = 0; i < firstRow.length; i++) {
        for (var j = 0; j < landkreise.length; j++) {
            if (landkreise[j].ags == "0" + firstRow[i]) {
                listCSVBWIndexes.push(i);
                break;
            }
        }
    }

    var data = [];

    for (var i = 1; i < lines.length; i++) {
        var row = lines[i].split(",");

        for (var j = 0; j < listCSVBWIndexes.length; j++) {
            var found = false;
            var dataJson = { cases: row[listCSVBWIndexes[j]], date: row[0] };

            if (dataJson.cases == null) continue;

            for (var k = 0; k < data.length; k++) {
                if (data[k].ags == "0" + firstRow[listCSVBWIndexes[j]]) {
                    data[k].historyCasesRKI.push(dataJson);
                    found = true;
                    break;
                }
            }

            if (!found) {
                data.push({ ags: "0" + firstRow[listCSVBWIndexes[j]], historyCasesRKI: [dataJson] });
            }
        }
    }

    return data;
}

async function getDeathsHistory() {
    console.log("get DeathsHistory");
    var data = [];

    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    var response = await fetch("https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/deaths-rki-by-ags.csv", requestOptions);
    if (response.status != 200) return undefined;

    var result = await response.text();
    var lines = result.split("\n");

    var landkreise = await db.find({}, "agsBW");
    var listCSVBWIndexes = [];
    var firstRow = lines[0].split(",");

    for (var i = 0; i < firstRow.length; i++) {
        for (var j = 0; j < landkreise.length; j++) {
            if (landkreise[j].ags == "0" + firstRow[i]) {
                listCSVBWIndexes.push(i);
                break;
            }
        }
    }

    var data = [];

    for (var i = 1; i < lines.length; i++) {
        var row = lines[i].split(",");

        for (var j = 0; j < listCSVBWIndexes.length; j++) {
            var found = false;
            var dataJson = { deaths: row[listCSVBWIndexes[j]], date: row[0] };

            if (dataJson.deaths == null) continue;

            for (var k = 0; k < data.length; k++) {
                if (data[k].ags == "0" + firstRow[listCSVBWIndexes[j]]) {
                    data[k].historyDeathsRKI.push(dataJson);
                    found = true;
                    break;
                }
            }

            if (!found) {
                data.push({ ags: "0" + firstRow[listCSVBWIndexes[j]], historyDeathsRKI: [dataJson] });
            }
        }
    }

    return data;
}

async function getDataCombined(saveToDB, mqttClient) {
    console.log("get DataCombined");
    var dataCases = await getCasesHistory();
    var dataDeaths = await getDeathsHistory();
    var dataCombined = [];

    for (var i = 0; i < dataCases.length; i++) {
        for (var j = 0; j < dataDeaths.length; j++) {
            if (dataCases[i].ags == dataDeaths[j].ags) {
                dataCombined.push({ ags: dataCases[i].ags, historyCasesRKI: dataCases[i].historyCasesRKI, historyDeathsRKI: dataDeaths[j].historyDeathsRKI });
                break;
            }
        }
    }

    if (saveToDB) {
        await db.dropCollection("csvRKI");
        await db.insertMany(dataCombined, "csvRKI");

        mqttClient.publish("refresh", "csvRKI");
    }

    return dataCombined;
}

getDataCombined(false);