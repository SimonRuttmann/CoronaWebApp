module.exports = { calcGeocodeForCompleteDB, calcGeocodeForAdress, calculateUserDistanceFromVaccPlace };

const MongoDB = require('../db.js');
const fetch = require('node-fetch')
const APIKey_geocodeapi = "76595980-f617-11eb-933b-bbbe22f4a3df"

var requestOptions = {
    method: 'GET',
    redirect: 'follow'
};


//Fetches and updates all docs in vaccinationPlaces with Geocode
async function calcGeocodeForCompleteDB() {
    //TODO: API DOESNT RECOGNISE ß !!!
    let response;
    let fails_by_api = 0, succ_afterFail = 0,fails_by_mongo=0;
    const data = await MongoDB.find({}, "vaccinationPlacesBW");

    for (let i in data) {
        let strasse = data[i].Adress;
        let ort = data[i].Ort;
        let land = "Deutschland";
        let platz = data[i].PLZ;
        const link = "https://app.geocodeapi.io/api/v1/search?apikey=" + APIKey_geocodeapi + "&text=" + strasse + "," + ort + "," + platz + "," + land
        
        for (var j = 0, status = 0; status != 200 && j <= 5; j++) {
            response = await fetch(link, requestOptions)
            if (response.status == 200) {
                response = await response.text();
                response = JSON.parse(response);
                status=200;
            }
            else status = response.status;
        }
        if(status==200){
            console.log(response)
            if(response.features.length>0)response= await MongoDB.updateOne({ "_id":data[i]._id }, { $set: { "Geocode": response.features[0].geometry } }, "vaccinationPlacesBW");
            else fails_by_api++
            if(!response.matchedCount>0) fails_by_mongo++;
        } 

    }
    
    response={"fails_by_api":fails_by_api,"success_after_fail_by_api":succ_afterFail,"fail_by_mongo":fails_by_mongo}
    return response;
}

//Returns Geocode for given adress
/*
adress={
    "Adress":"Musterstrasse 2",
    "Ort":"Musterort",
    "Platz":"75664"
    "Land":"Musterland"
}
*/
async function calcGeocodeForAdress(adress) {
    let response;
    //const db = await MongoDB.find({ "Ort": "Bad Mergentheim" }, "vaccinationPlacesBW")
    let strasse = adress.Adress;
    let ort = adress.Ort;
    let land = adress.Land;
    let platz = adress.Platz;
    const link = "https://app.geocodeapi.io/api/v1/search?apikey=" + APIKey_geocodeapi + "&text=" + strasse + "," + ort + "," + platz + "," + land
    //const link="https://app.geocodeapi.io/api/v1/search?apikey="+APIKey_geocodeapi+"&text=10%20Downing%20Street%2C%20Charlestown%2C%20NSW%2C%20Australia"
    console.log(link)
    response = await fetch(link, requestOptions)

    console.log(response)
    if (response.status == 200) {
        response = await response.text();
        response = JSON.parse(response);
    }
    else response = response.status;
    //console.log(await MongoDB.updateOne({"Ort":String(ort)},{$set:{"Geocode":response.features[0].geometry}},"vaccinationPlacesBW"))

    return response;
}

/*
Useradr={
   "Adress":"Musterstrasse 2",
   "Ort":"Musterort",
   "Platz":"75664"
   "Land":"Musterland"
   "Geocode":{"coodinates":[X,Y]}
}
VaccPlaceAdr={
   "Adress":"Musterstrasse 2",
   "Ort":"Musterort",
   "Platz":"75664"
   "Land":"Musterland"
   "Geocode":{"coodinates":[X,Y]}
}
*/
function calculateUserDistanceFromVaccPlace(Useradr, VaccPlaceAdr) {

    let response;
    const lat1 = -32.955015;
    const long1 = 151.68502;

    const lat2 = 49.487231;
    const long2 = 9.769926
    response = getDistanceFromLatLonInKm(lat1, long1, lat2, long2);
    return response;
}
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