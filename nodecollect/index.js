const districts = require('./districts');
const vaccination = require('./vaccination');
const mqtt = require('./mqtt');
const news = require('./news');
const csvInfections = require('./csvInfections');
const csvVaccinations = require('./csvVaccinations');
const agsBW = require('./ags');
const csvRKI = require('./csvRKI');
const geocode = require('./geocoding');
const dpf = require('./data_preparation_functions');

var mqttClient;
var failedMethods = [];

//am anfang ausführen
async function init() {
    console.log("---------Start Setup---------");

    console.log("MQTT");
    mqttClient = await mqtt.initMQTT();

    await ags();
    await district();
    await districtHistory();
    await vaccinationPlaces();
    await vaccinationDates();
    await vaccinationPlacesHistory();
    await vaccinationDatesHistory();
    await newsMethod();
    await csvInfectionsAll();
    await csvInfectionsMethod();
    await csvVaccinationsAll();
    await csvVaccinationsMethod();
    await csvrki();

    geocode.calcGeocodeForCompleteDB();
    dpf.getOverview();

    console.log("---------End Setup---------");
    console.log("---------" + failedMethods.length + " Failed Methods---------");
}

async function ags() {
    console.log("AGS");
    result = await agsBW.getAGSBW();
    if (result != undefined && result.length > 0) console.log("Done AGS");
    else {
        console.log("Failed AGS");
        failedMethods.push("AGS");
    }

    return "done";
}

async function district() {
    console.log("District");
    result = await districts.getDistricts(true, mqttClient);
    if (result != undefined && result.length > 0) {
        console.log("Done District");
        dpf.getOverview();
    }
    else {
        console.log("Failed District");
        failedMethods.push("District");
    }

    return "done";
}

async function districtHistory() {
    console.log("District History");
    result = await districts.saveHistory();
    if (result != undefined && result.length > 0) console.log("Done District History");
    else {
        console.log("Failed District History");
        failedMethods.push("District History");
    }

    return "done";
}

async function vaccinationPlaces() {
    console.log("Vaccination Places");
    result = await vaccination.getVaccinationPlaces(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done Vaccination Places");
    else {
        console.log("Failed Vaccination Places");
        failedMethods.push("Vaccination Places");
    }

    return "done";
}

async function vaccinationDates() {
    console.log("Vaccination Dates");
    result = await vaccination.getVaccinationDates(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done Vaccination Dates");
    else {
        console.log("Failed Vaccination Dates");
        failedMethods.push("Vaccination Dates");
    }

    return "done";
}

async function vaccinationPlacesHistory() {
    console.log("Vaccination Places History");
    result = await vaccination.saveHistoryPlaces();
    if (result != undefined && result.length > 0) console.log("Done Vaccination Places History");
    else {
        console.log("Failed Vaccination Places History");
        failedMethods.push("Vaccination Places History");
    }

    return "done";
}

async function vaccinationDatesHistory() {
    console.log("Vaccination Dates History");
    result = await vaccination.saveHistoryDates();
    if (result != undefined && result.length > 0) console.log("Done Vaccination Dates History");
    else {
        console.log("Failed Vaccination Dates History");
        failedMethods.push("Vaccination Dates History");
    }

    return "done";
}

async function newsMethod() {
    console.log("News");
    result = await news.getCoronaNewsToday(mqttClient);
    if (result != undefined && result.length > 0) console.log("Done News");
    else {
        console.log("Failed News");
        failedMethods.push("News");
    }

    return "done";
}

async function csvInfectionsAll() {
    console.log("CSVInfectionsAll");
    result = await csvInfections.getDataFromCSVInfectionsAll(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done CSVInfectionsAll");
    else {
        console.log("Failed CSVInfectionsAll");
        failedMethods.push("CSVInfectionsAll");
    }


    return "done";
}

async function csvInfectionsMethod() {
    console.log("CSVInfections");
    result = await csvInfections.getDataFromCSVInfections(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done CSVInfections");
    else {
        console.log("Failed CSVInfections");
        failedMethods.push("CSVInfections");
    }

    return "done";
}

async function csvVaccinationsAll() {
    console.log("CSVVaccinationsAll");
    result = await csvVaccinations.getDataFromCSVVaccinationsAll(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done CSVVaccinationsAll");
    else {
        console.log("Failed CSVVaccinationsAll");
        failedMethods.push("CSVVaccinationsAll");
    }

    return "done";
}

async function csvVaccinationsMethod() {
    console.log("CSVVaccinations");
    result = await csvVaccinations.getDataFromCSVVaccinations(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done CSVVaccinations");
    else {
        console.log("Failed CSVVaccinations");
        failedMethods.push("CSVVaccinations");
    }

    return "done";
}

async function csvrki() {
    console.log("CSVRKI");
    result = await csvRKI.getDataCombined(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done CSVRKI");
    else {
        console.log("Failed CSVRKI");
        failedMethods.push("CSVRKI");
    }

    return "done";
}

// alle fehlerhaften methoden neu versuchen
const interval30sec = setInterval(async () => {
    if (failedMethods.length == 0) return;

    console.log("---------Fixing Methods---------");

    var tmp = [];
    for (var i = 0; i < failedMethods.length; i++) {
        if (!tmp.includes(failedMethods[i])) {
            tmp.push(failedMethods[i]);
        }
    }
    failedMethods = [];

    for (var i = 0; i < tmp.length; i++) {
        var method = tmp.pop();
        i--;

        console.log("---------Fixing Method: " + method + "---------");

        switch (method) {
            case "AGS":
                await ags();
                break;
            case "District":
                await district();
                break;
            case "District History":
                await districtHistory();
                break;
            case "Vaccination Places":
                await vaccinationPlaces();
                break;
            case "Vaccination Dates":
                await vaccinationDates();
                break;
            case "Vaccination Places History":
                await vaccinationPlacesHistory();
                break;
            case "Vaccination Dates History":
                await vaccinationDatesHistory();
                break;
            case "News":
                await newsMethod();
                break;
            case "CSVInfectionsAll":
                await csvInfectionsAll();
                break;
            case "CSVInfections":
                await csvInfectionsMethod();
                break;
            case "CSVVaccinationsAll":
                await csvVaccinationsAll();
                break;
            case "CSVVaccinations":
                await csvVaccinationsMethod();
                break;
            case "CSVRKI":
                await csvrki();
                break;
            default:
                console.log("Fatal Error! Please contact Systemadmin!");
                break;
        }
    }

    console.log("---------Done Fixing Methods---------");
    console.log("---------" + failedMethods.length + " Failed Methods---------");
}, 30000);

// alle distrikte jede minute aktualisieren
const intervalMin = setInterval(async () => {
    if (failedMethods.includes("District")) return;

    await district();
}, 60000);

// alle corona news des tages jede stunde aktualisieren
const intervalHour = setInterval(async () => {
    if (failedMethods.includes("News") || failedMethods.includes("Vaccination Dates History")) return;

    await newsMethod();
    await vaccinationDatesHistory();
}, 3600000);

// alle impftermine 5 mal am tag aktualisieren
const interval5TimesPerDay = setInterval(async () => {
    if (failedMethods.includes("Vaccination Dates") || failedMethods.includes("CSVInfectionsAll") || failedMethods.includes("CSVInfections") || failedMethods.includes("CSVVaccinationsAll") || failedMethods.includes("CSVVaccinations")) return;

    await vaccinationDates();
    await csvInfectionsAll();
    await csvInfectionsMethod();
    await csvVaccinationsAll();
    await csvVaccinationsMethod();
}, 17280000);

// alle distrikte jeden tag speichern
const intervalDay = setInterval(async () => {
    if (failedMethods.includes("District History") || failedMethods.includes("CSVRKI")) return;

    await districtHistory();
    await csvrki();
}, 86400000);

// alle impforte jede woche speichern
const intervalWeek = setInterval(async () => {
    if (failedMethods.includes("Vaccination Places") || failedMethods.includes("Vaccination Places History")) return;

    await vaccinationPlaces();
    await vaccinationPlacesHistory();

    geocode.calcGeocodeForCompleteDB();
}, 604800000);

// clearInterval(interval);

init();