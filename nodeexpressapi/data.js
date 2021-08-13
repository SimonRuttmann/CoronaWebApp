const express = require('express');
const router = express.Router();
const MongoDB = require('./db.js');
const geocode = require('./geocoding.js');
const data_prep = require('./data_preparation_functions.js');

router.get('/', async (req, res) => {
	//res.send(await geocode.calcGeocodeForAdress({ "Ort": "Tuebingen", "Platz": "72072", "Land": "Deutschland" }));
	res.send(await geocode.calcGeocodeForCompleteDB())
});
router.get('/overview', async (req, res) => {
	let param, response = "";

	//Pfad für Param sucht daten eines spezifischen Landkreises
	console.log("Query: " + req.query);
	if (req.query.ags != undefined || req.query.district != undefined) {
		if (req.query.ags != undefined) param = req.query.ags;
		else {
			try {
				param = (await MongoDB.find({ "name": req.query.district }, "agsBW", { "ags": 1, "_id": 0 }))[0].ags;
			} catch (e) {
				res.send({ "error": true, "reason": "Couldnt communicate with MongoDB" });
				return;
			}
		}
		console.log(param);
		response = (await MongoDB.find({ "ags": param }, "overview"))[0];
	}
	else { //Pfad ohne Parameter -> schreibt alle Landkreisdaten zusammen
		try {
			response = (await MongoDB.find({ "ags": "-1" }, "overview"))[0];
		} catch (e) {
			res.send({ "error": true, "reason": "Couldnt communicate with MongoDB" });
			return;
		}
	}
	if (response == undefined || response.length == 0) response = { "error": true, "reason": "no data found" };
	res.send(response);
});

router.get('/vaccination', async (req, res) => {
	let response;
	response = await MongoDB.find({}, "vaccination")
	if (!response.length > 0) response = ({ "error": true, "reason": "No data from vaccinationPlacesBW" })
	res.send(response);
});

//Schickt die Daten für alle Districte oder für eines mit Parameterangabe, nach möglichkeit Historische Daten
router.get('/district', async (req, res) => {
	let param = null, response;
	if (req.query.ags != undefined || req.query.district != undefined) {
		if (req.query.ags != undefined) param = req.query.ags;
		else {
			try {
				param = (await MongoDB.find({ "name": req.query.district }, "agsBW", { "ags": 1, "_id": 0 }))[0].ags;
			} catch (e) { console.log(e) }
		}
	}
	try {
		if (param == null || param == undefined) {

			response = await getDistrictsFormated();

		}
		else {
			const historyDeathsDB = (await MongoDB.find({ "ags": param }, "csvRKI", { "historyDeathsRKI": 1, "_id": 0 }));
			const historyCasesDB = await MongoDB.find({ "ags": param }, "csvRKI", { "historyCasesRKI": 1, "_id": 0 });
			const infectionsDBFemale = await MongoDB.find({ "ags": param, "geschlecht": "W" }, "infectionsCSVBWAll");
			const infectionsDBMale = await MongoDB.find({ "ags": param, "geschlecht": "M" }, "infectionsCSVBWAll");
			const infectionsDBUnknown = await MongoDB.find({ "ags": param, "geschlecht": "unbekannt" }, "infectionsCSVBWAll");
			const infectionsDBAgeGroup1 = await MongoDB.find({ "ags": param, "altersgruppe": "A00-A04" }, "infectionsCSVBWAll"); 	//A00-A04
			const infectionsDBAgeGroup2 = await MongoDB.find({ "ags": param, "altersgruppe": "A05-A14" }, "infectionsCSVBWAll");	//A05-A14
			const infectionsDBAgeGroup3 = await MongoDB.find({ "ags": param, "altersgruppe": "A15-A34" }, "infectionsCSVBWAll");	//A15-A34
			const infectionsDBAgeGroup4 = await MongoDB.find({ "ags": param, "altersgruppe": "A35-A59" }, "infectionsCSVBWAll");	//A35-A59
			const infectionsDBAgeGroup5 = await MongoDB.find({ "ags": param, "altersgruppe": "A60-A79" }, "infectionsCSVBWAll");	//A60-A79
			const infectionsDBAgeGroup6 = await MongoDB.find({ "ags": param, "altersgruppe": "A80+" }, "infectionsCSVBWAll")
			const infectionsDBAgeGroup7 = await MongoDB.find({ "ags": param, "altersgruppe": "unbekannt" }, "infectionsCSVBWAll")
			const districtsBWDB = await MongoDB.find({ "ags": param }, "districtsBW")
			const vaccinationAll = await MongoDB.find({ "ags": param }, "vaccinationsCSVBWAll")

			const deaths_female = data_prep.getDeathsPerWeekCSV(infectionsDBFemale);
			const deaths_male = data_prep.getDeathsPerWeekCSV(infectionsDBMale);
			const deaths_unknown = data_prep.getDeathsPerWeekCSV(infectionsDBUnknown);
			const agegroup1 = data_prep.getDeathsPerWeekCSV(infectionsDBAgeGroup1);
			const agegroup2 = data_prep.getDeathsPerWeekCSV(infectionsDBAgeGroup2);
			const agegroup3 = data_prep.getDeathsPerWeekCSV(infectionsDBAgeGroup3);
			const agegroup4 = data_prep.getDeathsPerWeekCSV(infectionsDBAgeGroup4);
			const agegroup5 = data_prep.getDeathsPerWeekCSV(infectionsDBAgeGroup5);
			const agegroup6 = data_prep.getDeathsPerWeekCSV(infectionsDBAgeGroup6);
			const agegroup7 = data_prep.getDeathsPerWeekCSV(infectionsDBAgeGroup7);
			//const deathsPerWeek = data_prep.getDeathsPerWeekRKI(historyDeathsDB);
			//const casesPerWeek = data_prep.getCasesPerWeek(historyCasesDB);
			const vaccinatedPerWeek = data_prep.getVaccinatedPerWeek(vaccinationAll);
			const incidencePerWeek = data_prep.getIncidenceThisWeek(districtsBWDB);


			response = {
				"Weiblich_perWeek": deaths_female,
				"Männlich_perWeek": deaths_male,
				"Unknown_perWeek": deaths_unknown,
				"Alter00-04_perWeek": agegroup1,
				"Alter05-14:perWeek": agegroup2,
				"Alter15-34_perWeek": agegroup3,
				"Alter35-59_perWeek": agegroup4,
				"Alter60-79_perWeek": agegroup5,
				"Alter80+_perWeek": agegroup6,
				"AlterUnknown_perWeek": agegroup7,
				//"Tote_pro_Woche": deathsPerWeek,
				//"Fälle_pro_Woche": casesPerWeek,
				"Geimpte_per_Week": vaccinatedPerWeek,
				"Inzidenz_aktuell": incidencePerWeek
			};
		};
		res.send(response);
	} catch (e) {
		console.log(e);
		res.send(e);
	}
});

router.get('/news', async (req, res) => {
	const dbData_collection = "newsCoronaBW"
	let articleAmount = 10;
	let response = [];
	try {
		let calculatedDate, formattedDate, data;

		for (let i = 0; (i == 0 || data != undefined) && articleAmount > 0; i++) {
			calculatedDate = new Date(new Date().setDate(new Date().getDate() - i));
			formattedDate = calculatedDate.getFullYear() + "-" + String(calculatedDate.getMonth() + 1) + "-" + calculatedDate.getDate();
			data = (await MongoDB.find({ "date": formattedDate }, dbData_collection, { "articles": { $slice: articleAmount } }))[0];
			if (data != undefined) {
				response.push(data);
				articleAmount -= data.articles.length
			}
		}

		if (!response.length > 0) response = ({ "error": true, "reason": "No data from" + dbData_collection })
		res.send(response)
	} catch (e) {
		console.log(e)
		res.send(e)
	}
})

//Zugriff über /data/geocode/distance?lat1=X&long1=Y&lat2=C&long2=B
router.get('/geocode/distance', (req, res) => {
	const lat1 = req.query.lat1;
	const lat2 = req.query.lat2;
	const lon1 = req.query.long1;
	const lon2 = req.query.long2;
	if (lat1 == undefined || lat2 == undefined || lon1 == undefined || lon2 == undefined) res.send({ "error": true, "reason": "No parameters given" })
	res.send(String(getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2)))
})


//Zugriff über /data/geocode/city?c=X
router.get('/geocode/city', async (req, res) => {
	const city = req.query.c;
	const PLZ = req.query.p;
	adress = {
		"Ort": city,
		"PLZ": PLZ
	}
	if (city == undefined) res.send({ "error": true, "reason": "No parameters given" });

	res.send(await geocode.calcGeocodeForAdress(adress));
})

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = deg2rad(lat2 - lat1);  // deg2rad below
	var dLon = deg2rad(lon2 - lon1);
	var a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2)
		;
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c; // Distance in km
	return d;
}

function deg2rad(deg) {
	return deg * (Math.PI / 180)
}

module.exports = router;