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
    console.log("connect MQTT");
    mqttClient = await mqtt.initMQTT();

    console.log("AGS");
    await agsBW.getAGSBW();

    console.log("District");
    districts.getDistricts(true, mqttClient);
    districts.saveHistory();

    console.log("Vaccination");
    vaccination.getVaccinationPlaces(true, mqttClient);
    vaccination.getVaccinationDates(true, mqttClient);
    vaccination.saveHistoryPlaces();
    vaccination.saveHistoryDates();

    console.log("News");
    news.getCoronaNewsToday(mqttClient);

    console.log("CSVInfections");
    csvInfections.getDataFromCSVInfectionsAll(true, mqttClient);
    csvInfections.getDataFromCSVInfections(true, mqttClient);

    console.log("CSVVaccinations");
    csvVaccinations.getDataFromCSVVaccinationsAll(true, mqttClient);
    csvVaccinations.getDataFromCSVVaccinations(true, mqttClient);

    console.log("CSVRKI");
    csvRKI.getDataCombined(true, mqttClient);
}

// alle distrikte jede minute aktualisieren
const intervalMin = setInterval(() => {
    console.log("District");
    districts.getDistricts(true, mqttClient);
}, 60000);

// alle corona news des tages jede stunde aktualisieren
const intervalHour = setInterval(() => {
    console.log("News");
    news.getCoronaNewsToday(mqttClient);

    console.log("Vaccination");
    vaccination.saveHistoryDates();
}, 3600000);

// alle impftermine 5 mal am tag aktualisieren
const interval5TimesPerDay = setInterval(() => {
    console.log("Vaccination");
    vaccination.getVaccinationDates(true, mqttClient);

    console.log("CSVInfections");
    csvInfections.getDataFromCSVInfectionsAll(true, mqttClient);
    csvInfections.getDataFromCSVInfections(true, mqttClient);

    console.log("CSVVaccinations");
    csvVaccinations.getDataFromCSVVaccinationsAll(true, mqttClient);
    csvVaccinations.getDataFromCSVVaccinations(true, mqttClient);
}, 17280000);

// alle distrikte jeden tag speichern
const intervalDay = setInterval(() => {
    console.log("District");
    districts.saveHistory();

    console.log("CSVRKI");
    csvRKI.getDataCombined(true, mqttClient);
}, 86400000);

// alle impforte jede woche speichern
const intervalWeek = setInterval(() => {
    console.log("Vaccination");
    vaccination.getVaccinationPlaces(true, mqttClient);
    vaccination.saveHistoryPlaces();
}, 604800000);

// clearInterval(interval);

init();