const districts = require('./districts');

//am anfang ausführen
function init() {
    districts.getDistricts(true);
    districts.saveHistory();
}

// alle distrikte jede minute aktualisieren
const intervalMin = setInterval(() => {
    districts.getDistricts(true);
}, 60000);

// alle distrikte jeden tag speichern
const intervalDay = setInterval(() => {
    districts.saveHistory(false);
}, 86400000);

// clearInterval(interval);

init();