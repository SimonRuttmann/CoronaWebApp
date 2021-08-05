const districts = require('./districts');
const vaccination = require('./vaccination');
const mqtt = require('./mqtt');
const news = require('./news');
const csvInfections = require('./csvInfections');
const csvVaccinations = require('./csvVaccinations');
const agsBW = require('./ags');
const csvRKI = require('./csvRKI');

var mqttClient;

//am anfang ausführen
async function init() {
    var result;

    console.log("connect MQTT");
    mqttClient = await mqtt.initMQTT();

    console.log("AGS");
    result = await agsBW.getAGSBW();
    if (result != undefined && result.length > 0) console.log("Done AGS");
    else console.log("Failed AGS");

    console.log("District");
    result = await districts.getDistricts(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done District");
    else console.log("Failed District");
    result = await districts.saveHistory();
    if (result != undefined && result.length > 0) console.log("Done District History");
    else console.log("Failed District History");

    console.log("Vaccination");
    result = await vaccination.getVaccinationPlaces(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done Places");
    else console.log("Failed Places");
    result = await vaccination.getVaccinationDates(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done Dates");
    else console.log("Failed Dates");
    result = await vaccination.saveHistoryPlaces();
    if (result != undefined && result.length > 0) console.log("Done Places History");
    else console.log("Failed Places History");
    result = await vaccination.saveHistoryDates();
    if (result != undefined && result.length > 0) console.log("Done Dates History");
    else console.log("Failed Dates History");

    console.log("News");
    result = await news.getCoronaNewsToday(mqttClient);
    if (result != undefined && result.length > 0) console.log("Done News");
    else console.log("Failed News");

    console.log("CSVInfections");
    result = await csvInfections.getDataFromCSVInfectionsAll(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done CSVInfectionsAll");
    else console.log("Failed CSVInfectionsAll");
    result = await csvInfections.getDataFromCSVInfections(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done CSVInfections");
    else console.log("Failed CSVInfections");

    console.log("CSVVaccinations");
    result = await csvVaccinations.getDataFromCSVVaccinationsAll(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done CSVVaccinationsAll");
    else console.log("Failed CSVVaccinationsAll");
    result = await csvVaccinations.getDataFromCSVVaccinations(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done CSVVaccinations");
    else console.log("Failed CSVVaccinations");

    console.log("CSVRKI");
    result = await csvRKI.getDataCombined(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done CSVRKI");
    else console.log("Failed CSVRKI");
}

// alle distrikte jede minute aktualisieren
const intervalMin = setInterval(async () => {
    console.log("District");
    result = await districts.getDistricts(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done District");
    else console.log("Failed District");
}, 60000);

// alle corona news des tages jede stunde aktualisieren
const intervalHour = setInterval(async () => {
    console.log("News");
    result = await news.getCoronaNewsToday(mqttClient);
    if (result != undefined && result.length > 0) console.log("Done News");
    else console.log("Failed News");

    console.log("Vaccination");
    result = await vaccination.saveHistoryDates();
    if (result != undefined && result.length > 0) console.log("Done Dates History");
    else console.log("Failed Dates History");
}, 3600000);

// alle impftermine 5 mal am tag aktualisieren
const interval5TimesPerDay = setInterval(async () => {
    console.log("Vaccination");
    result = await vaccination.getVaccinationDates(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done Dates");
    else console.log("Failed Dates");

    console.log("CSVInfections");
    result = await csvInfections.getDataFromCSVInfectionsAll(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done CSVInfectionsAll");
    else console.log("Failed CSVInfectionsAll");
    result = await csvInfections.getDataFromCSVInfections(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done CSVInfections");
    else console.log("Failed CSVInfections");

    console.log("CSVVaccinations");
    result = await csvVaccinations.getDataFromCSVVaccinationsAll(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done CSVVaccinationsAll");
    else console.log("Failed CSVVaccinationsAll");
    result = await csvVaccinations.getDataFromCSVVaccinations(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done CSVVaccinations");
    else console.log("Failed CSVVaccinations");
}, 17280000);

// alle distrikte jeden tag speichern
const intervalDay = setInterval(async () => {
    console.log("District");
    result = await districts.saveHistory();
    if (result != undefined && result.length > 0) console.log("Done District History");
    else console.log("Failed District History");

    console.log("CSVRKI");
    result = await csvRKI.getDataCombined(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done CSVRKI");
    else console.log("Failed CSVRKI");
}, 86400000);

// alle impforte jede woche speichern
const intervalWeek = setInterval(async () => {
    console.log("Vaccination");
    result = await vaccination.getVaccinationPlaces(true, mqttClient);
    if (result != undefined && result.length > 0) console.log("Done Places");
    else console.log("Failed Places");
    result = await vaccination.saveHistoryPlaces();
    if (result != undefined && result.length > 0) console.log("Done Places History");
    else console.log("Failed Places History");
}, 604800000);

// clearInterval(interval);

init();