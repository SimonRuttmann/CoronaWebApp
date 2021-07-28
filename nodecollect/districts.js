const fetch = require('node-fetch');
const db = require('./db');

module.exports = { getDistricts, saveHistory };

async function getDistricts(saveToDB) {
    var data = [];

    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    var response = await fetch("https://api.corona-zahlen.org/districts/", requestOptions);
    if (response.status != 200) return undefined;

    var result = await response.text();
    var json = JSON.parse(result);

    for (var districtID in json.data) {
        if (json.data[districtID].state == "Baden-Württemberg") {
            data.push(json.data[districtID]);

            // delete data[data.length - 1].ags;
            delete data[data.length - 1].stateAbbreviation;
            // delete data[data.length - 1].county;

            data[data.length - 1].date = Date.now();
        }
    }

    if (saveToDB) {
        await db.dropCollection("districtsBW");
        await db.insertMany(data, "districtsBW");
    }

    return data;
}

/* async function saveHistory() {
    var data = await getDistricts(false);
    db.insertMany(data, "historyBW");
} */

function helper(arr, newData) {
    var tmp = [];
    for (var i = 0; i < arr.length; i++) {
        tmp.push(arr[i]);
    }

    tmp.push(newData);

    return tmp;
}

async function saveHistory() {
    var data = await getDistricts(false);
    var history = await db.find({}, "historyBW");

    if (history == undefined) history = [];

    for (var i = 0; i < data.length; i++) {
        var found = false;
        for (var j = 0; j < history.length; j++) {
            if (data[i].ags == history[j].ags) {
                found = true;

                history[j].population = helper(history[j].population, data[i].population);
                history[j].cases = helper(history[j].cases, data[i].cases);
                history[j].deaths = helper(history[j].deaths, data[i].deaths);
                history[j].casesPerWeek = helper(history[j].casesPerWeek, data[i].casesPerWeek);
                history[j].deathsPerWeek = helper(history[j].deathsPerWeek, data[i].deathsPerWeek);
                history[j].recovered = helper(history[j].recovered, data[i].recovered);
                history[j].weekIncidence = helper(history[j].weekIncidence, data[i].weekIncidence);
                history[j].casesPer100k = helper(history[j].casesPer100k, data[i].casesPer100k);
                history[j].delta = helper(history[j].delta, data[i].delta);
                history[j].date = helper(history[j].date, data[i].date);
            }
        }

        if (!found) {
            var tmp = data[i];

            tmp.population = [data[i].population];
            tmp.cases = [data[i].cases];
            tmp.deaths = [data[i].deaths];
            tmp.casesPerWeek = [data[i].casesPerWeek];
            tmp.deathsPerWeek = [data[i].deathsPerWeek];
            tmp.recovered = [data[i].recovered];
            tmp.weekIncidence = [data[i].weekIncidence];
            tmp.casesPer100k = [data[i].casesPer100k];
            tmp.delta = [data[i].delta];
            tmp.date = [data[i].date];

            history.push(tmp);
        }
    }

    await db.dropCollection("historyBW");
    await db.insertMany(history, "historyBW");
}