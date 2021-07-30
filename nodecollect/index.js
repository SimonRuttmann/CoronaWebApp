const districts = require('./districts');
const vaccination = require('./vaccination');
const mqtt = require('./mqtt');
const news = require('./news');
const csvInfections = require('./csvInfections');
const csvVaccinations = require('./csvVaccinations');
const agsBW = require('./ags');

var mqttClient;

//am anfang ausführen
async function init() {
    mqttClient = await mqtt.initMQTT();

    await agsBW.getAGSBW();

    districts.getDistricts(true, mqttClient);
    districts.saveHistory();

    vaccination.getVaccinationPlaces(true, mqttClient);
    vaccination.getVaccinationDates(true, mqttClient);
    vaccination.saveHistoryPlaces();
    vaccination.saveHistoryDates();

    news.getCoronaNewsToday(mqttClient);

    csvInfections.getDataFromCSVInfections(true, mqttClient);
    csvInfections.saveHistoryCSVInfections();

    csvVaccinations.getDataFromCSVVaccinationsAll(true, mqttClient);
    csvVaccinations.getDataFromCSVVaccinations(true, mqttClient);
}

// alle distrikte jede minute aktualisieren
const intervalMin = setInterval(() => {
    districts.getDistricts(true, mqttClient);
}, 60000);

// alle corona news des tages jede stunde aktualisieren
const intervalHour = setInterval(() => {
    news.getCoronaNewsToday(mqttClient);
}, 3600000);

// alle impftermine 5 mal am tag aktualisieren
const interval5TimesPerDay = setInterval(() => {
    vaccination.getVaccinationDates(true, mqttClient);

    csvInfections.getDataFromCSVInfections(true, mqttClient);

    csvVaccinations.getDataFromCSVVaccinationsAll(true, mqttClient);
    csvVaccinations.getDataFromCSVVaccinations(true, mqttClient);
}, 17280000);

// alle distrikte jeden tag speichern
const intervalDay = setInterval(() => {
    districts.saveHistory();

    vaccination.saveHistoryPlaces();
    vaccination.saveHistoryDates();

    csvInfections.saveHistoryCSVInfections();
}, 86400000);

// alle impforte jede woche speichern
const intervalWeek = setInterval(() => {
    vaccination.getVaccinationPlaces(true, mqttClient);
}, 604800000);

// clearInterval(interval);

init();