const express = require('express');
const router = express.Router();
const MongoDB = require('../db.js');
const dotenv = require('dotenv').config({ path: '../.env', encoding: 'utf8' });


//Alternativ Databaseaccess for /overview
router.get('/', async (req, res) => {
	res.send("Wilkommen auf der Datenroute");
});

router.get('/overview', async (req, res) => {
	let infected = 0, immune = 0, vaccinated = 0, recovered = 0, deaths = 0, param;
	try {
		var data = await getDistrictsFormated();
	} catch (e) {
		console.log("error: /overview");
	}

	if (data.error) {
		res.send(data)
		return;
	}

	data = data.Landkreise;
	//Pfad für Param sucht daten eines spezifischen Landkreises
	if (req.query.ags != undefined || req.query.district != undefined) {
		if (req.query.ags != undefined) param = req.query.ags;
		else
			try {
				param = (await MongoDB.find({ "name": req.query.district }, "agsBW", { "ags": 1, "_id": 0 }))[0].ags;
			}catch (e) {console.log(e)}
		let found = false;
		for (let i in data) {
			if (data[i].ags == param) {
				found = true;
				infected = Number(data[i].infizierte);
				immune = Number(data[i].immune);
				vaccinated = Number(data[i].geimpft);
				recovered = Number(data[i].genesen);
				deaths = Number(data[i].todesfaelle);
				break;
			}
		}
		if (!found) {
			res.send("Could not find requested data");
			return;
		}
	}
	else { //Pfad ohne Parameter -> schreibt alle Landkreisdaten zusammen
		for (let i in data) {
			infected += Number(data[i].infizierte);
			immune += Number(data[i].immune);
			vaccinated += Number(data[i].geimpft);
			recovered += Number(data[i].genesen);
			deaths += Number(data[i].todesfaelle);
		}
	}

	const response = {
		"infizierte": infected,
		"genesen": recovered,
		"geimpft": vaccinated,
		"immun": immune,
		"todesfaelle": deaths
	};

	res.send(response);
});

//Schickt die Daten für alle Districte oder für eines mit Parameterangabe, nach möglichkeit Historische Daten
router.get('/district', async (req, res) => {
	let param = req.query.ags;
	let response;
	if (param == null) {
		try {
			response = await getDistrictsFormated();
		}
		catch (e) {
			console.log("error: /distirct ");
		}
	}
	else {
		try{
		const historyDeathsDB = (await MongoDB.find({ "ags": param }, "csvRKI", { "historyDeathsRKI": 1, "_id": 0 }));
		const historyCasesDB = await MongoDB.find({ "ags": param }, "csvRKI", { "historyCasesRKI": 1, "_id": 0 });
		const infectionsDBFemale = await MongoDB.find({ "ags": param, "geschlecht": "W" }, "infectionsCSVBW");
		const infectionsDBMale = await MongoDB.find({ "ags": param, "geschlecht": "M" }, "infectionsCSVBW");
		const infectionsDBAgeGroup1 = await MongoDB.find({ "ags": param, "altersgruppe": "" }, "infectionsCSVBW"); //Welche Altersgruppen genau?
		const infectionsDBAgeGroup2 = await MongoDB.find({ "ags": param, "altersgruppe": "" }, "infectionsCSVBW");
		const districtsBWDB = await MongoDB.find({ "ags": param }, "districtsBW")
		const vaccinationAll = await MongoDB.find({ "ags": param }, "vaccinationsCSVBWAll")
		}catch(e){console.log(e)}
		//const recperWeek = undefined;
		const deaths_female = getDeathsForNewestData(infectionsDBFemale);
		const deaths_male = getDeathsForNewestData(infectionsDBMale);
		const deaths_agegroup1 = getDeathsForNewestData(infectionsDBAgeGroup1);
		const deaths_agegroup2 = getDeathsForNewestData(infectionsDBAgeGroup2);
		const deathsPerWeek = getDeathsPerWeek(historyDeathsDB);
		const casesPerWeek = getCasesPerWeek(historyCasesDB);
		//const idk = undefined;
		//const vaccinationOffersPerWeek = undefined;
		const vaccinatedPerWeek = getVaccinatedPerWeek(vaccinationAll);
		const incidencePerWeek = getIncidenceThisWeek(districtsBWDB);

		response = {
			//"Genesene_pro_Woche": recperWeek,
			"todesfälle_Weiblich": deaths_female,
			"todesfälle_Männlich": deaths_male,
			"todesfälle_Altergruppe1": deaths_agegroup1,
			"todesfälle_Altersgruppe2": deaths_agegroup2,
			"Tote_pro_Woche": deathsPerWeek,
			"Fälle_pro_Woche": casesPerWeek,
			//"Bevölkerung_pro_Woche": idk,
			//"Impfangebote_pro_Woche": vaccinationOffersPerWeek,
			"Geimpte_pro_Woche": vaccinatedPerWeek,
			"Inzidenz_aktuell": incidencePerWeek
		};

	};
	res.send(response);
});

router.get('/news', async (req, res) => {
	const dbData_collection = "newsCoronaBW"
	try{
	data = await MongoDB.find({}, dbData_collection, { "articles": { $slice: 10 } });
	}catch(e){console.log(e)}
	if (!data.length > 0) data = ({ "error": true, "no_data_from": dbData_collection })
	res.send(data)
})
function getVaccinatedPerWeek(data) {
	const response = [];
	if (!data.length > 0) response = ({ "error": true, "no_data_from": dbData_collection })
	else {
		let tmpDate1, tmpDate2, sortedData = [];
		mainloop:
		for (let i in data) {
			tmpDate1 = new Date((data[i].impfdatum).replace("-", "."));
			for (let j in sortedData) {
				tmpDate2 = new Date(String(sortedData[j].date).replace("-", "."));
				if (tmpDate1 == tmpDate2) {
					sortedData[j].anzahl += data[i].anzahl;
					continue mainloop;
				}
			}
			sortedData.push({ "date": tmpDate1, "anzahl": data[i].anzahl })
		}
		console.log(sortedData);

		var aufaddieren = 0;
		for (let i in sortedData) {
			aufaddieren += Number(sortedData[i].anzahl);
			if ((i % 7) == 6) {
				response.push({ "date": sortedData[i].date, "anzahl": aufaddieren })
				aufaddieren = 0;
			}
			if (i == data.length - 1) response.push({ "date": sortedData[i].date, "anzahl": aufaddieren })
		}
	}
	return response;
}

function getIncidenceThisWeek(data) {
	const response = data[0].weekIncidence;
	return response;
}

function getDeathsPerWeek(data) {
	//date ist immer das startdatum der woche, die aktuelle Woche kann weniger als 7 Tage beinhalten
	let response = [];
	if (!data.length > 0) response = { "error": true, "no_data_from": "csvRKI" }
	else data = data[0].historyDeathsRKI;
	if (!data.length > 0) response = { "error": true, "no_data_from": "csvRKI.historyDeathsRKI" }

	var aufaddieren = 0;
	for (let i in data) {
		aufaddieren += Number(data[i].deaths);
		if ((i % 7) == 6) {
			response.push({ "date": data[i].date, "deaths": aufaddieren })
			aufaddieren = 0;
		}
		if (i == data.length - 1) response.push({ "date": data[i].date, "deaths": aufaddieren })
	}
	return response;
}
function getCasesPerWeek(data) {
	//date ist immer das startdatum der woche, die aktuelle Woche kann weniger als 7 Tage beinhalten
	let response = [];
	if (!data.length > 0) response = { "error": true, "no_data_from": "csvRKI" }
	else data = data[0].historyCasesRKI;
	if (!data.length > 0) response = { "error": true, "no_data_from": "csvRKI.historyCasesRKI" }

	var aufaddieren = 0;
	for (let i in data) {
		aufaddieren += Number(data[i].cases);
		if ((i % 7) == 6) {
			response.push({ "date": data[i].date, "cases": aufaddieren })
			aufaddieren = 0;
		}
		if (i == data.length - 1) response.push({ "date": data[i].date, "cases": aufaddieren })
	}
	return response;
}

function getDeathsForNewestData(data) {
	//Es könnte sein das der Date Vergleich zu genau ist, dann müssen Studen gerundet werden
	let response = 0;
	if (!data.length > 0) response = { "error": true, "no_data_from": "infectionsCSVBW" };
	else {
		let newestDate = new Date(data[0].date);
		let compareDate;

		let filteredData = [];

		for (let i in data) {
			compareDate = new Date(data[i].date);
			if (newestDate < compareDate) {
				newestDate = compareDate;
				filteredData = [data[i]];
			}
			else if (compareDate == newestDate) filteredData.push(data[i])
		}
		for (let i in filteredData) {
			response += Number(filteredData[i].anzahltodesfall);
		}
	}
	return response;
}


//Sends back {error:true,{no_data_from:X}} in case of error
async function getDistrictsFormated() {
	const dbData_collection = "districtsBW"
	try {
		const dbData = await MongoDB.find({}, dbData_collection);
	} catch (e) {
		console.log("error: getDistrictsformated ");
	}

	if (dbData.length == 0) return ({ "error": true, "no_data_from": dbData_collection })
	var dbData2, response, param;

	response = '{"Landkreise":[';
	const dbData2_collection = "vaccinationsCSVBWCombined";
	for (let i in dbData) {
		param = JSON.parse('{"ags":"' + dbData[i].ags + '", "impfschutz":"2"}');
		try {
			dbData2 = await MongoDB.find(param, dbData2_collection);
		} catch (e) {
			console.log("error: getDistrictsfomrated 2");
		}
		if (dbData2.length == 0) return ({ "error": true, "no_data_from": dbData2_collection });
		var vaccinated = 0;
		for (let j in dbData2) {
			vaccinated = vaccinated + Number(dbData2[j].anzahl);
		}
		const immune = vaccinated + dbData[i].recovered;
		response = response +
			'{"Landkreis":"' + dbData[i].name +
			'","ags":"' + dbData[i].ags +
			'","infizierte":"' + dbData[i].cases +
			'","genesen":"' + dbData[i].recovered +
			'","geimpft":"' + vaccinated + //vaccinationsCSVBWCombined
			'","immune":"' + immune + //vaccinationsCSVBWCombined
			'","todesfaelle":"' + dbData[i].deaths +
			'","gesamtbevoelkerung":"' + dbData[i].population +
			'","wochen_inzidenz":"' + dbData[i].weekIncidence +
			'"},'
	}
	response = response.slice(0, -1) + "]}"
	return (JSON.parse(response));

}


module.exports = router;