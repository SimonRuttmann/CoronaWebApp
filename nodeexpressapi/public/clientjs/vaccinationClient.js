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
        user=true;
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

async function prepareVaccinationData(result){
    realResult =[];
    for(var i=0; i<result.length; i++ ){
       for(var j =0; j < result[i].Vaccines.length; j++){
        if(result[i].Vaccines[j].Available !=undefined && result[i].Vaccines[j].Available){
            realResult.push(result[i]);
            break;
            }
        }   
    }
    realResult.sort(GetSortOrder("Zentrumsname"));
    if(await user){//filer durchgehen
        getfilter()
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
            if(result.Distance == null){
                s.textContent="-";
            }
            else s.textContent=Math.round(result.Distance)+" km"; 
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

    var gefiltertResult = [];
//erstmal nur nach stadt sortieren und Distance
    abbruch:
    if(document.getElementById("city").value == ""){
        gefiltertResult=filterImpfstoff(realResult);
        fillTable(gefiltertResult);
    }
    else{
        var city = document.getElementById("city").value;
        var distValue = document.getElementById("radius").value;
        
        //console.log("button wurde gedruckt");
        //console.log(city);
        var copyResult= JSON.parse(JSON.stringify(realResult));
        
        var lat1, lon1;

        
        
        
        //unction getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        //test:
        //profile.city= "Stuttgart";
        //profile.latitude = 48.7758;
        //profile.longitude = 9.1829;

        if(city == profile.city && !isNaN(profile.latitude) && !isNaN(profile.longitude) ){
            
            lat1=profile.latitude;
            lon1=profile.longitude;
      
        }
        else{// berechnung der lat und lon vom Standort 
            var query="/data/geocode/city?c="+city;
                try{
                    var geoData= await fetch(query);
                    geo = await geoData.text();
                    geo = JSON.parse(geo);
                    
                }catch(e){
                    console.log("Server is not responing: geoDaten einer city"+e);
                }
                if (geo != undefined){
                    
                   lon1= geo.features[0].geometry.coordinates[0];
                   lat1= geo.features[0].geometry.coordinates[1];
                   console.log(city+"  " +lon1+ "lat1 "+lat1);
                   console.log(geo);

                }
                else{
                    var a = document.createElement("caption");
                    a.textContent="Fehlerhafte Eingabe im Feld Ort";
                    a.classList.add('error');
                    var table =document.getElementsByTagName("table")[0];
                    table.insertBefore(a, table.firstChild); 
                }
        }
            
            // berechnung mit koordinaten von city
            for(var i in copyResult){
                console.log(i);
                if(lon2=copyResult[i].Geocode != undefined && copyResult[i].Geocode != undefined ){
                    var lon2=copyResult[i].Geocode.coordinates[0];
                    var lat2=copyResult[i].Geocode.coordinates[1];
                    //console.log("long "+lon2+" lat "+lat2);
                    //console.log("lat1"+lat1+"&long1="+lon1+"&lat2="+lat2+"&long2="+lon2);
                    var query="/data/geocode/distance?lat1="+lat1+"&long1="+lon1+"&lat2="+lat2+"&long2="+lon2;
                    try{
                        var d= await fetch(query);
                        dist = await d.text();
                        //console.log("dist: "+dist+" d: "+d);
                        
                    }catch(e){
                        console.log("Server is not responing"+e);
                    }
                    if (dist != undefined){
                        
                        copyResult[i].Distance = dist;

                    }    
                }
                else{
                    var a = document.createElement("caption");
                    a.textContent="Die Distanze kann gerade nicht berechnet werden. Alle Impfangebote werden angezeigt.";
                    a.classList.add('error');
                    var table =document.getElementsByTagName("table")[0];
                    table.insertBefore(a, table.firstChild);

                    gefiltertResult=filterImpfstoff(realResult);
                    fillTable(gefiltertResult);
                    break abbruch;
                }
                
 
            }
            //realResult=sortJSON(realResult,"Distance",123);
            //copyResult.sort(GetSortOrder("Distance"));
            //console.log(copyResult);
            copyResult.sort(function(a, b){
                return a.Distance - b.Distance;
            });
            for (var i in copyResult){
                if(Number(copyResult[i].Distance) <= distValue ) gefiltertResult.push(copyResult[i]);
            }
            gefiltertResult = filterImpfstoff(gefiltertResult);
            

            if (!gefiltertResult.length > 0){
                var a = document.createElement("caption");
                a.textContent="Im angegebenen Ort und Umgebung sind derzeit keine Impftermine vorhanden";
                a.classList.add('error');
                var table =document.getElementsByTagName("table")[0];
                table.insertBefore(a, table.firstChild);  
                }
            else{
                console.log(gefiltertResult);
                
                fillTable(gefiltertResult);
            }
            

        //rechne geocode von city aus (eingegebener Value)

        

        // for (let i in result) {
        //     if(result[i].Ort == city){
        //         gefiltertResult.push(result[i]);
        //     }
        // }
        // if (!gefiltertResult.length > 0){
        //     var a = document.createElement("caption");
        //     a.textContent="Im angegebenen Ort sind derzeit keine Impftermine vorhanden";
        //     a.classList.add('error');
        //     var table =document.getElementsByTagName("table")[0];
        //     table.insertBefore(a, table.firstChild);  
        // }
        // else{
        //     fillTable(gefiltertResult);
        // }
    }


    // hier Impfpräferenz beachten
    // var biontech = document.getElementById("biontech").checked;
    // var moderna = document.getElementById("moderna").checked;
    // var astra = document.getElementById("astra").checked;
    // var johnson = document.getElementById("johnson").checked;
    //console.log(" checks: biontech: "+biontech+"\n moderna: "+moderna+"\n astra: "+astra+"\n johnson: "+johnson);

    
}

function filterImpfstoff(gefiltertResult){
    var biontech = document.getElementById("biontech").checked;
    var moderna = document.getElementById("moderna").checked;
    var astra = document.getElementById("astra").checked;
    var johnson = document.getElementById("johnson").checked;
    var newResults= [];
    
    if((biontech && moderna && astra && johnson)||(!biontech && !moderna && !astra && !johnson))
    {
        return gefiltertResult;
    }
    for(var j =0 ;j< gefiltertResult.length;j++ ){
        label:
        for(var i =0; i < gefiltertResult[j].Vaccines.length; i++){
            console.log("Vaccineslänge: "+gefiltertResult[j].Vaccines.length);
            var stoff= gefiltertResult[j].Vaccines[i].ID
            console.log(stoff);
            if(gefiltertResult[j].Vaccines[i].Available !=undefined && gefiltertResult[j].Vaccines[i].Available){
                switch (stoff){
                    case "biontech":
                        if(biontech){
                            newResults.push(gefiltertResult[j]);
                            break label;
                        };
                        break;
                    case "moderna":
                        if(moderna){
                            newResults.push(gefiltertResult[j]);
                            break label;
                        };
                        break;
                    case "astra_zeneca":
                        if(astra){
                            newResults.push(gefiltertResult[j]);
                            break label;
                        };
                        break;
                    case "johnsonjohnson":
                        if(johnson){
                            newResults.push(gefiltertResult[j]);
                            break label;
                        };
                        break;
                }
            }

            
        }
    }
    return newResults;
}


function GetSortOrder(prop){
    return function(a,b){
       if( a[prop] > b[prop]){
           return 1;
       }else if( a[prop] < b[prop] ){
           return -1;
       }
       return 0;
    }
 }
 function compareNumbers(a, b) {
    return a - b;
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
        
    }else user = false;
}
