//const geocode = require('./geocoding.js');

//const  geocode = require('../../routes/geocoding.js');
//const geocode = require('./map.js');

window.onload = init();
var menuDisplay=false;
//var result;
var realResult=[];
var user;

var slider = document.getElementById("radius");
var output = document.getElementById("slidervalue");
output.innerHTML = slider.value + " km";

slider.oninput = function() {
  output.innerHTML = this.value + " km";
}

var profile = 
{
    biontech:        false,                     
    moderna:         false,                 
    astra:           false,                 
    johnson:         false,                  
    latitude:        '0',               
    longitude:       '0',           
    city:            'none',
    radius:           0
}

function init(){
    getSessionData([setLoginStatus]);
    getImpfData(prepareVaccinationData);
    
};

async function getImpfData(callback){
    console.log("komme in function ImpfData");
    
    
    try{
        let response = await fetch('/data/vaccination');
        //reads response stream to completion
        result = await response.text();
        result = JSON.parse(result);
        console.log("results werden bekommen");
        //console.log(result);
    }
    catch(e){
        console.log("Server is not responing");
    }
    // wenn error kommt
    if(result.error != undefined){
        var a = document.createElement("caption");
        a.textContent="Aktuell können keine Impfangebote angezeigt werden";
        a.classList.add('error');
        var table =document.getElementsByTagName("table")[0];
        table.insertBefore(a, table.firstChild);
        
    }
    else if (result != undefined){
        
        
        callback(result);
        
    }

}

async function getUserData(){
    
    let userData;
    try{
        let response = await fetch('/user/getUserData');
        if(response.status != 200) {
            console.log("Received status: " + response.status);
            return;
        }
        
        //reads response stream to completion
        userData = await response.text();
        //console.log(result);
        userData = JSON.parse(userData);
        
    }
    catch(e){
        console.log("Server is not responing");
    }
    if (userData != undefined){
        
        profile.biontech = userData.biontech;
        profile.moderna = userData.moderna;
        profile.astra = userData.astra;
        profile.johnson = userData.johnson;
        profile.city = userData.city;
        profile.radius = userData.radius;
        profile.latitude = userData.latitude;            
        profile.longitude = userData.longitude;   
        setFilter();
    }

}

function setFilter(){    
    if(profile.biontech) document.getElementById("biontech").checked = true;
    if(profile.moderna) document.getElementById("moderna").checked = true;
    if(profile.astra) document.getElementById("astra").checked = true;
    if(profile.johnson) document.getElementById("johnson").checked = true;
    

    if(profile.district != "none"){
         document.getElementById("city").value = profile.district;
    }
    if(profile.radius != null ){
        document.getElementById("radius").value = profile.radius + " km";
    }
}

function prepareVaccinationData(result){
    realResult =[];
    for(var i=0; i<result.length; i++ ){
       for(var j =0; j < result[i].Vaccines.length; j++){
        if(result[i].Vaccines[j].Available !=undefined && result[i].Vaccines[j].Available){
            realResult.push(result[i]);
            break;
            }
        }   
    }
    if(user){//filer durchgehen

    }
    else{
        fillTable(realResult);
    }
    console.log("die vorbereiteten Results");
    console.log(realResult)
    
}


/*
<tr>
    <th>Impfzentrum</th>
    <th>Impfstoff</th>
    <th>Adresse</th>
    <th>BookingURL</th>
</tr>
*/
function fillTable(result){

    //oldResult=[];
    for(var i=0; i<result.length; i++ ){
        var td = buildTD(result[i]);
        //if(td instanceof Object){
        var table = document.getElementById("tableID");
        table.appendChild(td);
            // if(all){
            //     oldResult.push(result[i]);
            // }   
        //}
        // else{
        //     console.log("ist keine Impfung an stelle "+i);
        // }
    } 
    //console.log("hier das vorherige Ergebnis");
    //console.log(oldResult);
}

function buildTD(result){

        var s= document.createElement("td");
            s.textContent="-";
        var a= document.createElement("td");
            a.textContent=result.Zentrumsname;
        var b= document.createElement("td");
            var impfstoffe ="";
            for(var i =0; i < result.Vaccines.length; i++){
                //console.log("Vaccineslänge: "+result.Vaccines.length);
                var stoff= result.Vaccines[i].ID
                //console.log(stoff);
                if(result.Vaccines[i].Available !=undefined && result.Vaccines[i].Available){
                    switch (stoff){
                        case "biontech":
                            impfstoffe += "Biontech/Pfizer,";
                            break;
                        case "moderna":
                            impfstoffe += "Moderna,";
                            break;
                        case "astra_zeneca":
                            impfstoffe += "AstraZeneca,";
                            break;
                        case "johnsonjohnson":
                            impfstoffe += "Johnson&Johnson,";
                            break;
                    }
                }
                //console.log(i);
                //console.log(stoff)
                //console.log(impfstoffe);
                
            }
            // if (impfstoffe.length == 0) {  //-> durch Preparation ist die abfrage nicht mehr nötig
            //     return "keine Impfungen";
            // }
            // else{
            let impfstoffItems = impfstoffe.split(",");

            for (let i = 0; i < impfstoffItems.length-1; i++) {
                impfstoffItems[i] = "- " + impfstoffItems[i] + "<br>";
            }
            impfstoffe = impfstoffItems.join("");
        
            b.innerHTML=impfstoffe;
        var c= document.createElement("td");
            var adresse=document.createElement("p");
            var PLZ=document.createElement("p");
            adresse.textContent=result.Adresse;
            PLZ.textContent=result.PLZ +" "+ result.Ort;
            c.appendChild(adresse);
            c.appendChild(PLZ);
        


        var d= document.createElement("td");
            var x= document.createElement("a");
            x.textContent="Zur Homepage";
            x.href=result.BookingURL;
            x.classList.add('links');
            var y = document.createElement("p");
            //console.log("tel"+result.Tel);
            if(result.Tel != ""){
                y.textContent="Tel: "+result.Tel;
                d.appendChild(y);
            }
            d.appendChild(x);
            
        

    var dr = document.createElement("tr");
    dr.appendChild(s);
    dr.appendChild(a);
    dr.appendChild(b);
    dr.appendChild(c);
    dr.appendChild(d);
    
    //console.log(dr);
    return dr;
}


function filtermenu(){
    var a,b;
    if(!menuDisplay){
        a  = document.getElementsByClassName("filterOption");
        a[0].style.display='block';
        menuDisplay=true;
        b = document.getElementById("filter");
        b.textContent="Filter einklappen"; 
    }
    else{
        a = document.getElementsByClassName("filterOption");
        a[0].style.display='none';
        menuDisplay=false;
        b = document.getElementById("filter");
        b.textContent="Filter";
    }

}

async function getfilter(){
    if(document.getElementsByTagName("caption")[0] != undefined){
        var e= document.getElementsByTagName("caption")[0];
        console.log("hier wurde caption gelöscht "+e);
        e.remove()
    }
    // alles löschen
    var z =document.getElementById("tableID");
    var tr = z.getElementsByTagName("tr");
    var trL = tr.length;
    console.log("die länge von tabelleneinträgen"+tr);
    for(var o= 1 ; o< trL; o++){
        z.removeChild(tr[1]);
    }


//erstmal nur nach stadt sortieren
    if(document.getElementById("city").value == ""){
        fillTable(realResult);
    }
    else{
        var city = document.getElementById("city").value;
        var dist = document.getElementById("radius").value;
        //console.log("button wurde gedruckt");
        //console.log(city);
        var gefiltertResult = [];

        //Vorbereitung adresse von Suchanfrage:
        var adresse={
            "Ort":""
        }
        
        
        //unction getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        //test:
        profile.city= "Stuttgart";
        profile.latitude = 48.7758;
        profile.longitude = 9.1829;
        if(city == profile.city){
            // berechnung mit koordinaten von city
            for(var i in realResult){
                console.log(i);
                var lon2=realResult[i].Geocode.coordinates[0];
                var lat2=realResult[i].Geocode.coordinates[1];
                console.log("long "+lon2+" lat "+lat2);
                var dist= getDistanceFromLatLonInKm(profile.latitude,profile.longitude,lat2,lon2);
                realResult[i].Distance = dist;
                
            }
            console.log(realResult);
        }

        //rechne geocode von city aus (eingegebener Value)

        //var cityCords= await geocode.calcGeocodeForORT(adress);

        for (let i in result) {
            if(result[i].Ort == city){
                gefiltertResult.push(result[i]);
            }
        }
        if (!gefiltertResult.length > 0){
            var a = document.createElement("caption");
            a.textContent="Im angegebenen Ort sind derzeit keine Impftermine vorhanden";
            a.classList.add('error');
            var table =document.getElementsByTagName("table")[0];
            table.insertBefore(a, table.firstChild);  
        }
        else{
            fillTable(gefiltertResult);
        }
    }


    // hier Impfpräferenz beachten
    var biontech = document.getElementById("biontech").checked;
    var moderna = document.getElementById("moderna").checked;
    var astra = document.getElementById("astra").checked;
    var johnson = document.getElementById("johnson").checked;
    //console.log(" checks: biontech: "+biontech+"\n moderna: "+moderna+"\n astra: "+astra+"\n johnson: "+johnson);

    
}
// weg machen nicht vergessen -- ist geklaut
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




async function getSessionData(callbacks){
    let result;
    try{
        let response = await fetch('/user/getSessionInfo');
        if(response.status != 200) {
            console.log("Received status: " + response.status);
            return;
        }
    
        //reads response stream to completion
        result = await response.text();
        result = JSON.parse(result);
    }
    catch(e){
        console.log("Server is not responing");
    }
    if (result != undefined){
        callbacks.forEach( callback => callback(result))
    }

}

function setLoginStatus(data){
    if(data.authenticated){
        //Display feedback at footer
        document.getElementById("loginStatus").textContent="Sie sind angemeldet als: " + data.name;     
        //Modify Navigationbar to Logout    
        document.getElementById("RefToLogin").textContent="Abmelden";
        document.getElementById("RefToLogin").setAttribute("href", "/logout");
        getUserData();
        user=true;
    }else user = false;
}
