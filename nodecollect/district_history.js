const fetch = require('node-fetch');
const db = require('./db');

module.exports = { getHistoryData }

async function getHistoryData() {
    var data = {};

    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    var responseCases = await fetch("https://api.corona-zahlen.org/districts/history/cases", requestOptions);
    if (responseCases.status == 200) {
        var resultCases = await responseCases.text();
        var jsonCases = JSON.parse(resultCases);

        if (jsonCases.data != undefined) {
            data.historyCases = jsonCases;
        }
    }

    var responseIncidence = await fetch("https://api.corona-zahlen.org/districts/history/incidence", requestOptions);
    if (responseIncidence.status == 200) {
        var resultIncidence = await responseIncidence.text();
        var jsonIncidence = JSON.parse(resultIncidence);

        if (jsonIncidence.data != undefined) {
            data.historyIncidence = jsonIncidence;
        }
    }

    var responseDeaths = await fetch("https://api.corona-zahlen.org/districts/history/deaths", requestOptions);
    if (responseDeaths.status == 200) {
        var resultDeaths = await responseDeaths.text();
        var jsonDeaths = JSON.parse(resultDeaths);

        if (jsonDeaths.data != undefined) {
            data.historyDeaths = jsonDeaths;
        }
    }

    var responseRecovered = await fetch("https://api.corona-zahlen.org/districts/history/recovered", requestOptions);
    if (responseRecovered.status == 200) {
        var resultRecovered = await responseRecovered.text();
        var jsonRecovered = JSON.parse(resultRecovered);

        if (jsonRecovered.data != undefined) {
            data.historyRecovered = jsonRecovered;
        }
    }

    data = await formatData(data);

    // console.log(data.historyRecovered[0]);

    return data;
}

async function formatData(data) {
    var districtsBW = await db.find({}, "agsBW");
    var formatData = {};

    var tmp = [];
    for (var i = 0; i < districtsBW.length; i++) {
        if (data.historyRecovered == undefined) break;
        if (data.historyRecovered.data[districtsBW[i].ags] == undefined) continue;

        tmp.push(data.historyRecovered.data[districtsBW[i].ags]);
        delete tmp[tmp.length - 1].name;
    }

    formatData.historyRecovered = tmp;
    delete tmp;

    var tmp = [];
    for (var i = 0; i < districtsBW.length; i++) {
        if (data.historyIncidence == undefined) break;
        if (data.historyIncidence.data[districtsBW[i].ags] == undefined) continue;

        tmp.push(data.historyIncidence.data[districtsBW[i].ags]);
        delete tmp[tmp.length - 1].name;
    }

    formatData.historyIncidence = tmp;
    delete tmp;

    var tmp = [];
    for (var i = 0; i < districtsBW.length; i++) {
        if (data.historyDeaths == undefined) break;
        if (data.historyDeaths.data[districtsBW[i].ags] == undefined) continue;

        tmp.push(data.historyDeaths.data[districtsBW[i].ags]);
        delete tmp[tmp.length - 1].name;
    }

    formatData.historyDeaths = tmp;
    delete tmp;

    var tmp = [];
    for (var i = 0; i < districtsBW.length; i++) {
        if (data.historyCases == undefined) break;
        if (data.historyCases.data[districtsBW[i].ags] == undefined) continue;

        tmp.push(data.historyCases.data[districtsBW[i].ags]);
        delete tmp[tmp.length - 1].name;
    }

    formatData.historyCases = tmp;
    delete tmp;

    return formatData;
}

getHistoryData();

// setTimeout(() => {
//     console.log("test");
// }, 1000);