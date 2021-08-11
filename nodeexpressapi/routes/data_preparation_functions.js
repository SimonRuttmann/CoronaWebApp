module.exports = { getOverview, getVaccinatedPerWeek, getDeathsPerWeekRKI, getIncidenceThisWeek, getCasesPerWeek, getDeathsPerWeekCSV };

function getOverview(data, ags) {
	let infected = 0, immune = 0, vaccinated = 0, recovered = 0, deaths = 0
	let response;
	let found = false
	if (ags) {

		for (let i in data) {
			if (data[i].ags == ags) {
				found = true;
				infected = Number(data[i].infizierte);
				immune = Number(data[i].immune);
				vaccinated = Number(data[i].geimpft);
				recovered = Number(data[i].genesen);
				deaths = Number(data[i].todesfaelle);
				break;
			}
		}
	}
	else {
		for (let i in data) {
			infected += Number(data[i].infizierte);
			immune += Number(data[i].immune);
			vaccinated += Number(data[i].geimpft);
			recovered += Number(data[i].genesen);
			deaths += Number(data[i].todesfaelle);
		}
	}
	if ((ags && !found) || !data > 0) {
		response = ("Could not find requested data");
		return;
	}
	else {
		response = {
			"infizierte": infected,
			"genesen": recovered,
			"geimpft": vaccinated,
			"immun": immune,
			"todesfaelle": deaths
		};
	}
	return response;
}

function getVaccinatedPerWeek(data) {
	const response = [];
	if (!data.length > 0) response = ({ "error": true, "no_data_from": dbData_collection })
	else {
		let tmpDate1, tmpDate2, sortedData = [];
		mainloop:
		for (let i in data) {
			tmpDate1 = new Date((data[i].impfdatum).replaceAll("-", "."));
			for (let j in sortedData) {
				tmpDate2 = new Date(String(sortedData[j].date).replaceAll("-", "."));
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
	}
	return response;
}

function getDeathsPerWeekRKI(data) {
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

function getIncidenceThisWeek(data) {
	const response = data[0].weekIncidence;
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

function getDeathsPerWeekCSV(data) {
	//Es könnte sein das der Date Vergleich zu genau ist, dann müssen Studen gerundet werden
	let response = [];
	let sortedData = []
	if (!data.length > 0) response = { "error": true, "no_data_from": "infectionsCSVBW" };
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
		let aufaddierenDeaths= 0;
		let aufaddierenRec = 0;
		for (let i in sortedData) {
			aufaddierenCases += Number(sortedData[i].cases);
			aufaddierenRec += Number(sortedData[i].deaths)
			aufaddierenDeaths += Number(sortedData[i].deaths)
			if ((i % 7) == 6) {
				response.push({ "date": (sortedData[i].date).replaceAll("-","."), "cases": aufaddierenCases, "deaths": aufaddierenDeaths, "recovered": aufaddierenRec })
				aufaddierenCases = 0;
				aufaddierenRec = 0;
				aufaddierenDeaths = 0;
			}
			if (i == data.length - 1) response.push({ "date": (sortedData[i].date).replaceAll("-","."), "cases": aufaddierenCases, "deaths": aufaddierenDeaths, "recovered": aufaddierenRec })
		}
	}
	return response;
}