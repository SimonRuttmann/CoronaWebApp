const MongoDB = require('./db');

module.exports = { getOverview, getVaccinatedPerWeek, getDeathsPerWeekRKI, getIncidenceThisWeek, getCasesPerWeek, getDeathsPerWeekCSV, vaccinationData, calcHistoryData };

async function calcHistoryData() {
	var ags = await MongoDB.find({}, "agsBW");

	for (var i = 0; i < ags.length; i++) {
		const infectionsDBFemale = await MongoDB.find({ "ags": ags[i].ags, "geschlecht": "W" }, "infectionsCSVBWAll");
		const infectionsDBMale = await MongoDB.find({ "ags": ags[i].ags, "geschlecht": "M" }, "infectionsCSVBWAll");
		const infectionsDBUnknown = await MongoDB.find({ "ags": ags[i].ags, "geschlecht": "unbekannt" }, "infectionsCSVBWAll");
		const infectionsDBAgeGroup1 = await MongoDB.find({ "ags": ags[i].ags, "altersgruppe": "A00-A04" }, "infectionsCSVBWAll"); 	//A00-A04
		const infectionsDBAgeGroup2 = await MongoDB.find({ "ags": ags[i].ags, "altersgruppe": "A05-A14" }, "infectionsCSVBWAll");	//A05-A14
		const infectionsDBAgeGroup3 = await MongoDB.find({ "ags": ags[i].ags, "altersgruppe": "A15-A34" }, "infectionsCSVBWAll");	//A15-A34
		const infectionsDBAgeGroup4 = await MongoDB.find({ "ags": ags[i].ags, "altersgruppe": "A35-A59" }, "infectionsCSVBWAll");	//A35-A59
		const infectionsDBAgeGroup5 = await MongoDB.find({ "ags": ags[i].ags, "altersgruppe": "A60-A79" }, "infectionsCSVBWAll");	//A60-A79
		const infectionsDBAgeGroup6 = await MongoDB.find({ "ags": ags[i].ags, "altersgruppe": "A80+" }, "infectionsCSVBWAll")
		const infectionsDBAgeGroup7 = await MongoDB.find({ "ags": ags[i].ags, "altersgruppe": "unbekannt" }, "infectionsCSVBWAll")
		const districtsBWDB = await MongoDB.find({ "ags": ags[i].ags }, "districtsBW")
		const vaccinationAll = await MongoDB.find({ "ags": ags[i].ags }, "vaccinationsCSVBWAll")

		const deaths_female = getDeathsPerWeekCSV(infectionsDBFemale);
		const deaths_male = getDeathsPerWeekCSV(infectionsDBMale);
		const deaths_unknown = getDeathsPerWeekCSV(infectionsDBUnknown);
		const agegroup1 = getDeathsPerWeekCSV(infectionsDBAgeGroup1);
		const agegroup2 = getDeathsPerWeekCSV(infectionsDBAgeGroup2);
		const agegroup3 = getDeathsPerWeekCSV(infectionsDBAgeGroup3);
		const agegroup4 = getDeathsPerWeekCSV(infectionsDBAgeGroup4);
		const agegroup5 = getDeathsPerWeekCSV(infectionsDBAgeGroup5);
		const agegroup6 = getDeathsPerWeekCSV(infectionsDBAgeGroup6);
		const agegroup7 = getDeathsPerWeekCSV(infectionsDBAgeGroup7);
		const vaccinatedPerWeek = getVaccinatedPerWeek(vaccinationAll);
		const incidencePerWeek = getIncidenceThisWeek(districtsBWDB);

		response = {
			"ags": ags[i].ags,
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
			"Geimpte_per_Week": vaccinatedPerWeek,
			"Inzidenz_aktuell": incidencePerWeek
		};

		await MongoDB.deleteOne({ ags: ags[i].ags }, "historyData");
		await MongoDB.insertOne(response, "historyData");
	}
}

async function getDistrictsFormated() {
	const dbData_collection = "districtsBW"
	try {
		const dbData = await MongoDB.find({}, dbData_collection);
		if (dbData.length == 0) return ({ "error": true, "reason": "No data from" + dbData_collection })
		var dbData2, response, param;

		response = '{"Landkreise":[';
		const dbData2_collection = "vaccinationsCSVBWCombined";
		for (let i in dbData) {
			param = JSON.parse('{"ags":"' + dbData[i].ags + '", "impfschutz":"2"}');
			dbData2 = await MongoDB.find(param, dbData2_collection);
			if (dbData2.length == 0) return ({ "error": true, "reason": "No data from" + dbData_collection });
			var vaccinated = 0;
			for (let j in dbData2) {
				vaccinated = vaccinated + Number(dbData2[j].anzahl);
			}
			const immun = vaccinated + dbData[i].recovered;
			response = response +
				'{"Landkreis":"' + dbData[i].name +
				'","ags":"' + dbData[i].ags +
				'","infizierte":"' + dbData[i].cases +
				'","genesen":"' + dbData[i].recovered +
				'","geimpft":"' + vaccinated + //vaccinationsCSVBWCombined
				'","immun":"' + immun + //vaccinationsCSVBWCombined
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

async function getOverview() {
	var data = await getDistrictsFormated();

	if (data.error) {
		console.log("problem1");
		return;
	}

	data = data["Landkreise"];

	let infected = 0, immun = 0, vaccinated = 0, recovered = 0, deaths = 0;
	let response;

	for (let i in data) {
		infected += Number(data[i].infizierte);
		immun += Number(data[i].immun);
		vaccinated += Number(data[i].geimpft);
		recovered += Number(data[i].genesen);
		deaths += Number(data[i].todesfaelle);
	}

	response = {
		"ags": "-1",
		"infizierte": infected,
		"genesen": recovered,
		"geimpft": vaccinated,
		"immun": immun,
		"todesfaelle": deaths
	};

	let length = await MongoDB.find({}, "overview").length;
	if (length == data.length + 1) {
		for (var i = 0; i < data.length; i++) {
			await MongoDB.updateOne({ ags: data[i].ags }, { $set: { infizierte: data[i].infizierte, genesen: data[i].genesen, geimpft: data[i].geimpft, immun: data[i].immun, todesfaelle: data[i].tode } }, "overview");
		}
		await MongoDB.updateOne({ ags: "-1" }, { $set: { infizierte: response.infizierte, genesen: response.genesen, geimpft: response.geimpft, immun: response.immun, todesfaelle: response.tode } }, "overview");
	} else {
		await MongoDB.dropCollection("overview");
		await MongoDB.insertMany(data, "overview");
		await MongoDB.insertOne(response, "overview");
	}

	return;
}

async function vaccinationData() {
	let response = [];
	let tmp, data2, data = await MongoDB.find({}, "vaccinationPlacesBW");

	console.log(data.length)
	for (let i in data) {
		tmp = {
			"Zentrumsname": data[i].Zentrumsname,
			"Adresse": data[i].Adress,
			"PLZ": data[i].PLZ,
			"Ort": data[i].Ort,
			"Tel": data[i].Phone,
			"Distance": null,
			"BookingURL": data[i].BookingURL,
			"Vaccines": data[i].Vaccines,
			"Geocode": data[i].Geocode
		}
		for (let j in tmp.Vaccines) {
			data2 = (await MongoDB.find({ "Slug": tmp.Vaccines[j].Slug }, "vaccinationDatesBW"))[0];
			tmp.Vaccines[j].Available = data2.Available;
			tmp.Vaccines[j].NoBooking = data2.NoBooking;
		}
		response.push(tmp)
	}

	await MongoDB.dropCollection("vaccination");
	await MongoDB.insertMany(response, "vaccination");
}

function getVaccinatedPerWeek(data) {
	var response = [];

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
	//console.log(sortedData);

	var aufaddieren = 0;
	for (let i in sortedData) {
		aufaddieren += Number(sortedData[i].anzahl);
		if ((i % 7) == 6) {
			response.push({ "date": sortedData[i].date, "anzahl": aufaddieren })
			aufaddieren = 0;
		}
		if (i == data.length - 1) response.push({ "date": sortedData[i].date, "anzahl": aufaddieren })
	}

	return response;
}

function getDeathsPerWeekRKI(data) {
	//date ist immer das startdatum der woche, die aktuelle Woche kann weniger als 7 Tage beinhalten
	let response = [];
	if (!data.length > 0) response = { "error": true, "reason": "No data from csvRKI" }
	else data = data[0].historyDeathsRKI;
	if (!data.length > 0) response = { "error": true, "reason": "No data from csvRKI.historyDeathsRKI" }

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

function getIncidenceThisWeek(data) {
	const response = data[0].weekIncidence;
	return response;
}

function getCasesPerWeek(data) {
	//date ist immer das startdatum der woche, die aktuelle Woche kann weniger als 7 Tage beinhalten
	let response = [];
	if (!data.length > 0) response = { "error": true, "reason": "No data from csvRKI" }
	else data = data[0].historyCasesRKI;
	if (!data.length > 0) response = { "error": true, "reason": "No data from csvRKI.historyCases" }

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

function getDeathsPerWeekCSV(data) {
	//Es könnte sein das der Date Vergleich zu genau ist, dann müssen Studen gerundet werden
	let response = [];
	let sortedData = []
	if (!data.length > 0) response = { "error": true, "reason": "No data from infectionsCSVBW" };
	else {
		let tmpDate1, tmpDate2;
		mainloop:
		for (let i in data) {
			console.log("RunNr:" + i + " von " + data.length)
			tmpDate1 = data[i].meldedatum
			for (let j in sortedData) {
				tmpDate2 = sortedData[j].date
				if (tmpDate1 == tmpDate2) {
					sortedData[j].cases += Number(data[i].anzahlfall);
					sortedData[j].deaths += Number(data[i].anzahltodesfall);
					sortedData[j].recovered += Number(data[i].anzahlgenesen);
					continue mainloop;
				}
			}
			sortedData.push({ "date": tmpDate1, "cases": Number(data[i].anzahlfall), "deaths": Number(data[i].anzahltodesfall), "recovered": Number(data[i].anzahlgenesen) })
		}
		let aufaddierenCases = 0;
		let aufaddierenDeaths = 0;
		let aufaddierenRec = 0;
		for (let i in sortedData) {
			aufaddierenCases += Number(sortedData[i].cases);
			aufaddierenRec += Number(sortedData[i].recovered)
			aufaddierenDeaths += Number(sortedData[i].deaths)
			if ((i % 7) == 6) {
				response.push({ "date": sortedData[i].date, "cases": aufaddierenCases, "deaths": aufaddierenDeaths, "recovered": aufaddierenRec })
				aufaddierenCases = 0;
				aufaddierenRec = 0;
				aufaddierenDeaths = 0;
			}
			if (i == data.length - 1) response.push({ "date": sortedData[i].date, "cases": aufaddierenCases, "deaths": aufaddierenDeaths, "recovered": aufaddierenRec })
		}
	}
	return response;
}