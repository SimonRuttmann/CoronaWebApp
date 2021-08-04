const express = require('express');
const router = express.Router();
const MongoDB = require('../db.js');


//Alternativ Databaseaccess for /overview
router.get('/', async (req, res) => {
	res.send("Wilkommen auf der Datenroute");
});


router.get('/overview', async (req, res) => {
	let infected = 0, immune = 0, vaccinated = 0, recovered = 0, deaths = 0,param;
	var data = await getDistrictsFormated();
	if(data.error){
		res.send(data)
		return;
	}
	data=data.Landkreise;
	if(req.query.ags !=undefined || req.query.district!=undefined){
		console.log("Get specific overview")
		if(req.query.ags != undefined) param=req.query.ags;
		else param =(await MongoDB.find({"name":req.query.district},"agsBW",{"ags":1,"_id":0}))[0].ags;
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
	else{
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
		const recperWeek = await getGenesenProWoche(param);
		const deaths_female = undefined;
		const deaths_male = undefined;
		const deaths_agegroup1 = undefined;
		const deaths_agegroup2 = undefined;
		const deathsPerWeek = undefined;
		const casesPerWeek = undefined;
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

router.get('/news',async (req,res)=>{
	const dbData_collection="newsCoronaBW"
	data = await MongoDB.find({},dbData_collection,{"articles":{$slice: 5}});
	if(data.length==0) data = ({"error":true,"no_data_from":dbData_collection})
	res.send(data)
})

async function getGenesenProWoche(ags) {
	let response;
	param = JSON.parse('{"ags":"' + ags + '"}');
	const data = await MongoDB.find(param, "infectionsCSVBWAll");
	response = "[{";
	var wochenSortiert = {
		"weeks": [{
			"startDatum": undefined,			//Montag der Woche
			"docs": [{}]
		}]
	}
	for (let i in data) {
		console.log(data[i].meldedatum)
	}
	return response;
}

//Sends back {error:true,{no_data_from:X}} in case of error
async function getDistrictsFormated() {
	const dbData_collection="districtsBW"
	const dbData = await MongoDB.find({}, dbData_collection);
	if(dbData.length==0) return({"error":true,"no_data_from":dbData_collection})
	var dbData2, response, param;

	response = '{"Landkreise":[';
	const dbData2_collection="vaccinationsCSVBWCombined";
	for (let i in dbData) {
		param = JSON.parse('{"ags":"' + dbData[i].ags + '", "impfschutz":"2"}');

		dbData2 = await MongoDB.find(param,dbData2_collection);
		if(dbData2.length==0) return({"error":true,"no_data_from":dbData2_collection});
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