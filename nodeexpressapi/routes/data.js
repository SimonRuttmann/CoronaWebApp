const express = require('express');
const router = express.Router();
const MongoDB = require('../db.js');
const geocode = require('./geocoding.js');
const data_prep = require('./data_preparation_functions.js');

router.get('/', async (req, res) => {
	//res.send(await geocode.calcGeocodeForAdress({"Adress":"Europastraße  50","Ort":"Tübingen","Platz":"72072","Land":"Deutschland"}));
	res.send(await geocode.calcGeocodeForCompleteDB())
});
router.get('/overview', async (req, res) => {
	let param;
	try {
		var data = await getDistrictsFormated();
	} catch (e) {
		console.log(e);
	}

	if (data == undefined || data.error) {
		res.send("Couldnt find data")
		return;
	}

	data = data.Landkreise;
	//Pfad für Param sucht daten eines spezifischen Landkreises
	console.log("Query: " + req.query)
	if (req.query.ags != undefined || req.query.district != undefined) {
		if (req.query.ags != undefined) param = req.query.ags;
		else {
			try {
				param = (await MongoDB.find({ "name": req.query.district }, "agsBW", { "ags": 1, "_id": 0 }))[0].ags;
			} catch (e) { console.log(e) }
		}
		console.log(param)
		response = data_prep.getOverview(data, param)
	}
	else { //Pfad ohne Parameter -> schreibt alle Landkreisdaten zusammen
		response = data_prep.getOverview(data)
	}
	res.send(response);
});

//Schickt die Daten für alle Districte oder für eines mit Parameterangabe, nach möglichkeit Historische Daten
router.get('/district', async (req, res) => {
	let param=null,response;
	if( req.query.ags!=undefined || req.query.district != undefined){
		if (req.query.ags != undefined) param = req.query.ags;
		else {
			try {
				param = (await MongoDB.find({ "name": req.query.district }, "agsBW", { "ags": 1, "_id": 0 }))[0].ags;
			} catch (e) { console.log(e) }
		}
	}
	try {
		if (param == null || param==undefined) {

			response = await getDistrictsFormated();

		}
		else {
			const historyDeathsDB = (await MongoDB.find({ "ags": param }, "csvRKI", { "historyDeathsRKI": 1, "_id": 0 }));
			const historyCasesDB = await MongoDB.find({ "ags": param }, "csvRKI", { "historyCasesRKI": 1, "_id": 0 });
			const infectionsDBFemale = await MongoDB.find({ "ags": param, "geschlecht": "W" }, "infectionsCSVBW");
			const infectionsDBMale = await MongoDB.find({ "ags": param, "geschlecht": "M" }, "infectionsCSVBW");
			const infectionsDBAgeGroup1 = await MongoDB.find({ "ags": param, "altersgruppe": "" }, "infectionsCSVBW"); //Welche Altersgruppen genau?
			const infectionsDBAgeGroup2 = await MongoDB.find({ "ags": param, "altersgruppe": "" }, "infectionsCSVBW");
			const districtsBWDB = await MongoDB.find({ "ags": param }, "districtsBW")
			const vaccinationAll = await MongoDB.find({ "ags": param }, "vaccinationsCSVBWAll")

			//const recperWeek = undefined;
			const deaths_female = data_prep.getDeathsForNewestData(infectionsDBFemale);
			const deaths_male = data_prep.getDeathsForNewestData(infectionsDBMale);
			const deaths_agegroup1 = data_prep.getDeathsForNewestData(infectionsDBAgeGroup1);
			const deaths_agegroup2 = data_prep.getDeathsForNewestData(infectionsDBAgeGroup2);
			const deathsPerWeek = data_prep.getDeathsPerWeek(historyDeathsDB);
			const casesPerWeek = data_prep.getCasesPerWeek(historyCasesDB);
			//const idk = undefined;
			//const vaccinationOffersPerWeek = undefined;
			const vaccinatedPerWeek = data_prep.getVaccinatedPerWeek(vaccinationAll);
			const incidencePerWeek = data_prep.getIncidenceThisWeek(districtsBWDB);

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

		if (!response.length > 0) response = ({ "error": true, "no_data_from": dbData_collection })
		res.send(response)
	} catch (e) {
		console.log(e)
		res.send(e)
	}

})


//Sends back {error:true,{no_data_from:X}} in case of error
async function getDistrictsFormated() {
	const dbData_collection = "districtsBW"
	try {
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
	} catch (e) {
		console.log(e);
		return e
	}


}


module.exports = router;