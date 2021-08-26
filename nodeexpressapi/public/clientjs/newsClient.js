window.onload = init();

var zweiSeiten=true;
var anzahlArtikel;
var anzahlArrays;
let realResult;
var onPage =false;


function init(){
    getSessionData([setLoginStatus]);
    getNewsToday(setNewsToday);
};

//mqtt
var host= "localhost";
var port= 1884;
var clientId= "client-News";
var sus= "news";
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

/* Vorgehensweise bei ankommenden Nachrichten */
function MessageArrived(message) {
    //console.log(message.destinationName +" : " + message.payloadString);
    
    if(onPage){
        var mes  = JSON.parse(message.payloadString);
        
        if(mes.info == "newNews4Today"){
             for(var i = 0; i <mes.data[0].articles.length; i++){
                for(var j = 0; j< realResult[0].articles.length; j++){
                    if(mes.data[0].articles[i].title == realResult[0].articles[j].title){
                        mes.data[0].articles.splice(i, 1);
                    }
                }
             }
             if(mes.data[0].articles.length >0){
                for(var i = 0; i <mes.data[0].articles.length; i++){
                    realResult[0].articles.unshift(mes.data[0].articles[i]);
                    
                    
                }
                setNewsToday(realResult);
             }
        }
        
    }
    

    
}
//mqtt ende





/* Holt sich die News-Daten */
async function getNewsToday(callback){
    try{
        let response = await fetch('/data/news');
        
        //reads response stream to completion
        result = await response.text();
        result = JSON.parse(result);
    }
    catch(e){
        console.log("Server is not responing");
    }
    // wenn error kommt
    if(result.error != undefined){
        var a = document.createElement("p");
        a.textContent="Aktuell können keine weiteren Nachrichten angezeigt werden";
        a.classList.add('error');
        var section =document.getElementsByTagName("section")[0];
        section.appendChild(a);
        result=undefined;
        buttonManager();

    }
    else if (result != undefined){
       
        realResult = JSON.parse(JSON.stringify(result));
        callback(result);
    }

}

/* stellt die News-Daten für den User da */
function setNewsToday(result){
  
    countArticles(result);
    buttonManager();
    onPage = true;
    if(document.getElementsByTagName("details").length>0){
        var z =document.getElementsByTagName("details").length;
    
        for(var o= 0; o< z; o++){
            var e= document.getElementsByTagName("details")[0];
            console.log(e);
            e.remove();
        }
    }
    
    var eingefügteArtikel=0;
    for(var j=0; j<anzahlArrays; j++){
        for( var l =0; l < result[j].articles.length && eingefügteArtikel <5; l++){
            
            var art = buildNewsblock(result[j].articles[l],result[j]);
            var section =document.getElementsByTagName("section")[0];
            section.appendChild(art);
            eingefügteArtikel++;

        }
    }
}

/* Zählt wie viele Artikel insgesamt in den News-Daten sind. */
function countArticles(result){
    anzahlArtikel=0;
    anzahlArrays=0;
    for(var i = 0;i<5;i++ ){
        if(anzahlArtikel != 10 && result[i] != undefined){
            anzahlArtikel += result[i].articles.length;
            console.log("i ist: "+(i));
        }
        else{
            console.log("Anzahl loops "+(i));
            anzahlArrays=i;
            break
        };
    }
    console.log("AnzahlArtikel "+anzahlArtikel);
}

/* Baut ein html-Element mit den Daten eines Artikels */
function buildNewsblock(artikel,datum){
   
    var newsblock = document.createElement("details");
    var summary = document.createElement("summary");
    var title = document.createElement("b")
    title.textContent =artikel.title+"  ---  "+datum.date;
    var umbruch = document.createElement("br");
    var zus = document.createElement("p");
    zus.textContent =artikel.description;  
    var inh = document.createElement("p");
    inh.textContent =artikel.content; 
    var aut = document.createElement("p")
    aut.textContent ="Author: "+artikel.author; 
    var url = document.createElement("a")
    url.textContent = "Zum Originalartikel";
    url.href=artikel.url;
    url.classList.add('links');
    summary.appendChild(title);
    summary.appendChild(umbruch);
    summary.appendChild(zus);

    newsblock.appendChild(summary);
    newsblock.appendChild(inh);
    newsblock.appendChild(aut);
    newsblock.appendChild(url);

    return newsblock
}

/* Verantwortlich für Aktivierung/Deaktivierung der Weiter und Zurück-Taste*/
function buttonManager(){
    if(result != undefined && anzahlArtikel>=6){
        zweiSeiten=true;
        //Tasten aktivieren
        document.getElementById("zuruck").disabled=true;
        document.getElementById("seite2").disabled=false;
        document.getElementById("zuruck").style.display='inline-block';
        document.getElementById("seite2").style.display='inline-block';
        
    }
    else{
        zweiSeiten =false;
        //Tasten deaktivieren
        document.getElementById("zuruck").disabled=true;
        document.getElementById("seite2").disabled=true;
        document.getElementById("zuruck").style.display='none';
        document.getElementById("seite2").style.display='none';
    }
}

/* zeigt die ersten 5 Artikel, wenn auf Button "zurück" geklickt wird */
function aufSeite1(){
    var z =document.getElementsByTagName("details").length;
    for(var o= 0; o< z; o++){
        var e= document.getElementsByTagName("details")[0];
        console.log(e);
        e.remove();
    }
    setNewsToday(result);  
    document.getElementById("zuruck").disabled=true;
    document.getElementById("seite2").disabled=false; 
}

/* zweigt weitere 5 Ariktel, wenn auf Button "weiter" geklickt wird */
function aufSeite2(){
    var z =document.getElementsByTagName("details").length;
    console.log("Seite1 auf seite 2: hie ist länge von details"+z);
    for(var o= 0; o< z; o++){
        var e= document.getElementsByTagName("details")[0];
        console.log(e);
        e.remove();
    }
    var eingefügteArtikel=0;
    var spring=0;
        for(var j=0; j<anzahlArrays; j++){
            for( var l =0; l < result[j].articles.length && eingefügteArtikel <5; l++){
                    spring++
                    if(spring > 5){
                        var art = buildNewsblock(result[j].articles[l],result[j]);
                        var section =document.getElementsByTagName("section")[0];
                        section.appendChild(art);
                        eingefügteArtikel++;
                    }
                    
            }
    }
    document.getElementById("seite2").disabled=true;
    document.getElementById("zuruck").disabled=false;
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

/* Setzt die Info im Footer */
function setLoginStatus(data){
    if(data.authenticated){
        //Display feedback at footer
        document.getElementById("loginStatus").textContent="Sie sind angemeldet als: " + data.name;     
        //Modify Navigationbar to Logout    
        document.getElementById("RefToLogin").textContent="Abmelden";
        document.getElementById("RefToLogin").setAttribute("href", "/logout");
    }
}