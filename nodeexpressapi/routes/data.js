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
	var data = await getDistrictsFormated();
	if (data.error) {
		res.send(data)
		return;
	}
	data = data.Landkreise;
	if (req.query.ags != undefined || req.query.district != undefined) {
		console.log("Get specific overview")
		if (req.query.ags != undefined) param = req.query.ags;
		else param = (await MongoDB.find({ "name": req.query.district }, "agsBW", { "ags": 1, "_id": 0 }))[0].ags;
		let found = false;
		for (let i in data) {
			console.log("Get specific overview")
			if (data[i].ags == param) {
				console.log("found ags")
				console.log(data[i])
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
	else {
		console.log("Get general overview")
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

//Schickt die Daten für alle Districte oder für eines mit Parameterangabe(angabe mit /?var=val)
router.get('/district', async (req, res) => {
	let param = req.query.ags;
	let response;
	if (param == null) {
		response = await getDistrictsFormated();
	}
	else {
		//Noch nicht funktionsfähig, ist unbekannt wie ich daten formatieren muss
		//param =JSON.parse('{"ags":"' + param + '"}'); //Anpassen an DB-Form
		const historyDeathsDB = await MongoDB.find({ "ags": param }, "csvRKI", { "historyDeathsRKI": 1, "_id": 0 });
		const historyCasesDB = await MongoDB.find({ "ags": param }, "csvRKI", { "historyCasesRKI": 1, "_id": 0 });
		const infectionsDBFemale = await MongoDB.find({ "ags": param, "geschlecht": "W" }, "infectionsCSVBW");
		const infectionsDBMale = await MongoDB.find({ "ags": param, "geschlecht": "M" }, "infectionsCSVBW");

		const recperWeek = undefined;
		const deaths_female = getDeathsForNewestData(infectionsDBFemale);
		const deaths_male = getDeathsForNewestData(infectionsDBMale);
		const deaths_agegroup1 = undefined;
		const deaths_agegroup2 = undefined;
		const deathsPerWeek = getDeathsPerWeek(historyDeathsDB);
		const casesPerWeek = getCasesPerWeek(historyCasesDB);
		const idk = undefined;
		const vaccinationOffersPerWeek = undefined;
		const vaccinatedPerWeek = undefined;
		const incidencePerWeek = undefined;
		//const dbData = await MongoDB.find(param, "historyinfectionsCSVBW")
		//if (dbData.length == 0) {
		//	console.log(new Date(1627813823410).toString())
		//	res.send("No Data found for Parameter"+req.query+"\nPlease use ags for district specification");
		//	return;
		//};
		response = {
			"Genesene_pro_Woche": recperWeek,
			"todesfälle_Weiblich": deaths_female,
			"todesfälle_Männlich": deaths_male,
			"todesfälle_Altergruppe1": deaths_agegroup1,
			"todesfälle_Altersgruppe2": deaths_agegroup2,
			"Tote_pro_Woche": deathsPerWeek,
			"Fälle_pro_Woche": casesPerWeek,
			"Bevölkerung_pro_Woche": idk,
			"Impfangebote_pro_Woche": vaccinationOffersPerWeek,
			"Geimpte_pro_Woche": vaccinatedPerWeek,
			"Inzidenz_pro_Woche": incidencePerWeek
		};

	};
	res.send(response);
});

router.get('/news', async (req, res) => {
	data = await MongoDB.find({}, "newsCoronaBW", { "articles": { $slice: 10 } });
	res.send(data)
})

function getDeathsPerWeek(data) {
	//date ist immer das startdatum der woche, die aktuelle Woche kann weniger als 7 Tage beinhalten
	let response = [];
	data = data[0].historyDeathsRKI;
	if (data == undefined || data.length == 0) response = { "error": true, "no_data_from": "csvRKI" }

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
	data = data[0].historyCasesRKI;
	if (data == undefined || data.length == 0) response = { "error": true, "no_data_from": "csvRKI" }

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

function getDeathsForNewestData(data){
	//Es könnte sein das der Date Vergleich zu genau ist, dann müssen Studen gerundet werden
	let response=0;
	let compareDate;
	let newestDate=new Date(data[0].date);
	let filteredData=[];
	if(data.length==0) response={ "error": true, "no_data_from": "infectionsCSVBW" }
	console.log(data)
	for(let i in data){
		compareDate=new Date(data[i].date);
		if(newestDate<compareDate){
			newestDate=compareDate;
			filteredData=[data[i]];
		}
		else if(compareDate==newestDate) filteredData.push(data[i]) 
	}
	console.log(filteredData)
	for(let i in filteredData){
		response+=Number(filteredData[i].anzahltodesfall);
	}
	return response;
}


//Sends back {error:true,{no_data_from:X}} in case of error
async function getDistrictsFormated() {
	const dbData_collection = "districtsBW"
	const dbData = await MongoDB.find({}, dbData_collection);
	if (dbData.length == 0) return ({ "error": true, "no_data_from": dbData_collection })
	var dbData2, response, param;

	response = '{"Landkreise":[';
	const dbData2_collection = "vaccinationsCSVBWCombined";
	for (let i in dbData) {
		param = JSON.parse('{"ags":"' + dbData[i].ags + '", "impfschutz":"2"}');

		dbData2 = await MongoDB.find(param, dbData2_collection);
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