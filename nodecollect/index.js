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

// alle impftermine 5 mal am tag aktualisieren
const interval5TimesPerDay = setInterval(() => {
    vaccination.getVaccinationDates(true, mqttClient);
}, 17280000);

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