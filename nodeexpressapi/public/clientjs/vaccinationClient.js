window.onload = init();
var menuDisplay=false;
var realResult=[];
var user;
var rawResult=[];
var onPage=false;

//Wert des Schiebers wird angezeigt
var slider = document.getElementById("radius");
var output = document.getElementById("slidervalue");
output.innerHTML = slider.value + " km";
slider.oninput = function() {
  output.innerHTML = this.value + " km";
}

//im Eingabefeld für den Ort kann die Suche gleich mit der Eingabetaste gestartet werden
var input = document.getElementById("city");
input.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
   event.preventDefault();
   document.getElementById("filterOK").click();
  }
});

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

// mqtt 
var host= "localhost";
var port= 1884;
var clientId= "client-vaccination";
var sus= "vaccination";
client = new Paho.MQTT.Client(host, Number(port), clientId);
client.onMessageArrived = MessageArrived;
client.onConnectionLost = ConnectionLost;
Connect();

/*mqtt Verbindung herstellen*/
function Connect(){
    client.connect({
    onSuccess: Connected,
    onFailure: ConnectionFailed
    });
}

/*Callback bei Erfolgreicher Verbindung */
function Connected() {
    console.log("Connected");
    client.subscribe(sus);
}

/*Callback bei gescheiterten Verbindung */
function ConnectionFailed(res) {
    console.log("Connect failed:" + res.errorMessage);
}

/*Callback bei verlorener Verbindung*/
function ConnectionLost(res) {
    if (res.errorCode !== 0) {
        console.log("Connection lost:" + res.errorMessage);
        Connect();
    }
}

/* Vorgehensweise bei ankommenden Nachrichten*/
function MessageArrived(message) {
    //console.log(message.destinationName +" : " + message.payloadString);
    
    if(onPage){
        var mes  = JSON.parse(message.payloadString);
        if(mes.info == "neuesImpfzentrum"){
            neuesZentrum(mes);    
        }
        else if(mes.info == "aenderungTermin"){
            terminaenderung(mes,false);
        }
        else if(mes.info == "neuladen"){
            getImpfData(prepareVaccinationData);
        }
        else if(mes.info == "neuerTermin"){
            terminaenderung(mes,true);
        }
    }
}
// mqtt ende

/* fügt ein neues Impfzentrum den bestehenden Daten hinzu */
async function neuesZentrum(mes){
    tmp={
        "Zentrumsname": mes.data[0].Zentrumsname,
        "Adresse": mes.data[0].Adress,
        "PLZ": mes.data[0].PLZ,
        "Ort": mes.data[0].Ort,
        "Tel": mes.data[0].Phone,
        "Distance": null,
        "BookingURL": mes.data[0].BookingURL,
        "Vaccines": mes.data[0].Vaccines,
        "Geocode" : [],
        "Slug" 	  : mes.data[0].Slug
    }

    // Geodaten für das Zentrum holen
    var query="/data/geocode/city?c="+mes.data[0].Ort;
    try{
        var geoData= await fetch(query);
        geo = await geoData.text();
        geo = JSON.parse(geo);
        console.log(geo);
        
    }catch(e){
        console.log("Server is not responing: Geodaten eines neuen Impfzentrums "+e);
    }
    if (geo.features != undefined && geo.features.length >0){
        tmp.Geocode = geo.features[0].geometry
    }
    rawResult.push(tmp);
}

/*Terminänderung wird dem Testzentrum in den Daten zugeordnet. Dargestellte Daten werden aktualisiert */
function terminaenderung(mes,neu){
    
    //Slug des Impzentrums aus dem Slug des Termins erstellen
    const str = mes.data[0].Slug;
    const words = str.split('_');
    var stringSlug = words[0];
    for(var i=1; i<words.length-1; i++){
        stringSlug += "_"+words[i];
    }
    
    for(var i =0; i < rawResult.length; i++){
        if(rawResult[i].Slug == stringSlug){
            if(neu){ // wenn ein neues Impfstoff im Zentrum nun angeboten wird, hinzufügen zu den Daten des Zentrums
                rawResult[i].Vaccines.push(mes.data[0]);
                console.log(rawResult[i]);
                prepareVaccinationData(rawResult);
            }
            else{
                for(var j=0; rawResult[i].Vaccines.length; j++){
                    if(rawResult[i].Vaccines[j].Slug ==  mes.data[0].Slug){
                        rawResult[i].Vaccines[j].Available= mes.data[0].Available;
                        rawResult[i].Vaccines[j].NoBooking= mes.data[0].NoBooking;
                        prepareVaccinationData(rawResult);
                        break;
                    }
                }
            }
        }
    }
}


/* ganzen Datensatz holen*/
async function getImpfData(callback){

    try{
        let response = await fetch('/data/vaccination');
        result = await response.text();
        result = JSON.parse(result);
        console.log("results werden bekommen");
    }
    catch(e){
        console.log("Server is not responing");
    }
    if(result.error != undefined){
        document.getElementById("load").style.display="none";
        var a = document.createElement("caption");
        a.textContent="Aktuell können keine Impfangebote angezeigt werden";
        a.classList.add('error');
        var table =document.getElementsByTagName("table")[0];
        table.insertBefore(a, table.firstChild);
        
    }
    else if (result != undefined){
        rawResult= JSON.parse(JSON.stringify(result));
        callback(result);
    }
}

/* holt sich die User Daten und speichert sie in die Variable Profile */
async function getUserData(){
    
    let userData;
    try{
        let response = await fetch('/user/getUserData');
        if(response.status != 200) {
            console.log("Received status: " + response.status);
            return;
        }
        
        userData = await response.text();
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

/*fügt vorhandene Einstellungen des Users hinzu, die in seinem Profil festgelegt sind */
function setFilter(){    
    if(profile.biontech) document.getElementById("biontech").checked = true;
    if(profile.moderna) document.getElementById("moderna").checked = true;
    if(profile.astra) document.getElementById("astra").checked = true;
    if(profile.johnson) document.getElementById("johnson").checked = true;
    

    if(profile.city != "none" && profile.city != undefined){
         document.getElementById("city").value = profile.city;
    }
    if(profile.radius != null ){       
        var t =document.getElementById("radius").value = profile.radius;
        var output = document.getElementById("slidervalue");
        output.innerHTML = t+ " km";
    }
    
}

/* der erhaltene Gesamte Datensatz wird vorbereitet */
async function prepareVaccinationData(result){
    realResult =[];

    //alle Impfzentren ohne aktuell erhältliche Impfstoffe fallen weg
    for(var i=0; i<result.length; i++ ){
       for(var j =0; j < result[i].Vaccines.length; j++){
        if(result[i].Vaccines[j].Available !=undefined && result[i].Vaccines[j].Available){
            realResult.push(result[i]);
            break;
            }
        }   
    }

    realResult.sort(GetSortOrder("Zentrumsname"));
    if(await user){
        getfilter()
    }
    else if(onPage == false){
        fillTable(realResult);
    }
    else{
        getfilter();
    } 
}

/* befüllt die Tabelle */
function fillTable(result){
    document.getElementById("load").style.display="none";
    onPage=true;

    for(var i=0; i<result.length; i++ ){
        var td = buildTD(result[i]);
        var table = document.getElementById("tableID");
        table.appendChild(td);
    } 
}

/*erstellt ein neues html-Elemente der Tabelle und fügt die Werte des Impfzentrums hinzu  */
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
                var stoff= result.Vaccines[i].ID
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
            }
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

    return dr;
}

/*öffnet und schließt das Filtermenü */
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

/* Filtert die Daten den Angaben entsprechend und stellt das Ergebnis da */
async function getfilter(){
    // Load-Symbol wird aktiviert
    if(document.getElementById("load").style.display != "block"){
        document.getElementById("load").style.display="block";
    }
    
    // Fehlerwarnung wird entfernt
    if(document.getElementsByTagName("caption")[0] != undefined){
        var e= document.getElementsByTagName("caption")[0];
        e.remove()
    }
    
    // alle Tabelleneinträge werden entfernt
    var z =document.getElementById("tableID");
    var tr = z.getElementsByTagName("tr");
    var trL = tr.length;
    for(var o= 1 ; o< trL; o++){
        z.removeChild(tr[1]);
    }

    var gefiltertResult = [];

    abbruch:
    // Wenn die Eingabe für Ort leer ist, werden alle Impfzentren, alphabetisch nach Name sortiert, angezeigt
    if(document.getElementById("city").value == ""){
        gefiltertResult=filterImpfstoff(realResult);
        fillTable(gefiltertResult);
    }
    else{
        var city = document.getElementById("city").value;
        var distValue = document.getElementById("radius").value;;
        var copyResult= JSON.parse(JSON.stringify(realResult));
        var lat1, lon1;

        if(city == profile.city && !isNaN(profile.latitude) && !isNaN(profile.longitude) ){
            console.log("city daten übernommen");
            lat1=profile.latitude;
            lon1=profile.longitude;
            console.log("komme hier in den Vergleich"+city+" lon1 " +lon1+ "lat1 "+lat1);
      
        }
        else{ // Berechnung des Geocodes für den eingegebenen Ort
            var query="/data/geocode/city?c="+city;
                try{
                    var geoData= await fetch(query);
                    geo = await geoData.text();
                    geo = JSON.parse(geo);
                    console.log(geo);
                    
                }catch(e){
                    console.log("Server is not responing: geoDaten einer city"+e);
                }
                if (geo.features != undefined && geo.features.length >0){
                    
                   lon1= geo.features[0].geometry.coordinates[0];
                   lat1= geo.features[0].geometry.coordinates[1];


                }
                else{
                    var a = document.createElement("caption");
                    a.textContent="Fehlerhafte Eingabe im Feld Ort";
                    a.classList.add('error');
                    var table =document.getElementsByTagName("table")[0];
                    table.insertBefore(a, table.firstChild); 
                    document.getElementById("load").style.display="none";
                    break abbruch;
                }
        }
            // Berechnung der Distanz zu allen gültigen Impfzentren
            var zahler =0;
            for(var i in copyResult){
                if(copyResult[i].Geocode != undefined ){
                    zahler++;
                    var lon2=copyResult[i].Geocode.coordinates[0];
                    var lat2=copyResult[i].Geocode.coordinates[1];
                    var query="/data/geocode/distance?lat1="+lat1+"&long1="+lon1+"&lat2="+lat2+"&long2="+lon2;
                    try{
                        var d= await fetch(query);
                        dist = await d.text();
                        console.log("dist: "+dist+" d: "+d);
                        
                    }catch(e){
                        console.log("Server is not responing"+e);
                    }
                    if (dist != undefined){
                        
                        copyResult[i].Distance = dist;

                    }    
                }

                if(zahler ==0){

                    var a = document.createElement("caption");
                    a.textContent="Die Distanze kann gerade nicht berechnet werden. Alle Impfangebote entsprechend der gewählten Impfstoffen werden angezeigt.";
                    a.classList.add('error');
                    var table =document.getElementsByTagName("table")[0];
                    table.insertBefore(a, table.firstChild);
                    gefiltertResult=filterImpfstoff(realResult);
                    fillTable(gefiltertResult);
                    document.getElementById("load").style.display="none";
                    break abbruch;
                }
                
 
            }

        // Zentrenn nach Distanz sortieren. 
        copyResult.sort(function(a, b){
            return a.Distance - b.Distance;
        });
        // nur Zenteren Übernehmen, die innerhalb der gewünschten Distanz liegen
        for (var i in copyResult){
            if(Number(copyResult[i].Distance) <= distValue ) gefiltertResult.push(copyResult[i]);
        }
        gefiltertResult = filterImpfstoff(gefiltertResult);

        if (!gefiltertResult.length > 0){
            document.getElementById("load").style.display="none";
            var a = document.createElement("caption");
            a.textContent="Im angegebenen Ort und Umgebung sind derzeit keine Impftermine vorhanden";
            a.classList.add('error');
            var table =document.getElementsByTagName("table")[0];
            table.insertBefore(a, table.firstChild);  
            }
        else{
            fillTable(gefiltertResult);
        }
    }  
}

/*Filtert Impfzentren entsprechend der gewünschten Impfstoffe*/
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
            var stoff= gefiltertResult[j].Vaccines[i].ID
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

/*Sortieralgorithmus */
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

/* holt sich SessionDaten */
async function getSessionData(callbacks){
    let result;
    try{
        let response = await fetch('/user/getSessionInfo');
        if(response.status != 200) {
            console.log("Received status: " + response.status);
            return;
        }
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

/*Setzt die Info im Footer */
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
