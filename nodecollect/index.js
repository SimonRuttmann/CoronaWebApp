const districts = require('./districts');
const vaccination = require('./vaccination');
const mqtt = require('./mqtt');

var mqttClient;

//am anfang ausführen
async function init() {
    mqttClient = await mqtt.initMQTT();

    districts.getDistricts(true, mqttClient);
    districts.saveHistory();

    vaccination.getVaccinationPlaces(true, mqttClient);
    vaccination.getVaccinationDates(true, mqttClient);
    vaccination.saveHistoryPlaces();
    vaccination.saveHistoryDates();
}

// alle distrikte jede minute aktualisieren
const intervalMin = setInterval(() => {
    districts.getDistricts(true, mqttClient);
}, 60000);

// alle impftermine jede 10 minuten aktualisieren
const interval10Min = setInterval(() => {
    vaccination.getVaccinationDates(true, mqttClient);
}, 600000);

// alle distrikte jeden tag speichern
const intervalDay = setInterval(() => {
    districts.saveHistory();

    vaccination.saveHistoryPlaces();
    vaccination.saveHistoryDates();
}, 86400000);

// alle impforte jede woche speichern
const intervalWeek = setInterval(() => {
    vaccination.getVaccinationPlaces(true, mqttClient);
}, 604800000);

// clearInterval(interval);

init();