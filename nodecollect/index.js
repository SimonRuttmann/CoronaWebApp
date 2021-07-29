const districts = require('./districts');
const vaccination = require('./vaccination');

//am anfang ausführen
function init() {
    districts.getDistricts(true);
    districts.saveHistory();

    vaccination.getVaccinationPlaces(true);
    vaccination.getVaccinationDates(true);
    vaccination.saveHistoryPlaces();
    vaccination.saveHistoryDates();
}

// alle distrikte jede minute aktualisieren
const intervalMin = setInterval(() => {
    districts.getDistricts(true);
}, 60000);

// alle impftermine jede 10 minuten aktualisieren
const interval10Min = setInterval(() => {
    vaccination.getVaccinationDates(true);
}, 600000);

// alle distrikte jeden tag speichern
const intervalDay = setInterval(() => {
    districts.saveHistory();

    vaccination.saveHistoryPlaces();
    vaccination.saveHistoryDates();
}, 86400000);

// alle impforte jede woche speichern
const intervalWeek = setInterval(() => {
    vaccination.getVaccinationPlaces(true);
}, 604800000);

// clearInterval(interval);

init();