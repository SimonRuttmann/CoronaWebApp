//error bearbeiten noch
//mqtt noch einbauen -> antwort behandeln -> noch inserten in result!!
//was wenn datenlänge kleiner 10

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

// mqtt hier hinzufügen:
var host= "localhost";
var port= 1884;
var clientId= "client-News";
var sus= "news";
client = new Paho.MQTT.Client(host, Number(port), clientId);
                                    console.log("wurde benutzt paho"+client);
client.onMessageArrived = MessageArrived;
client.onConnectionLost = ConnectionLost;
Connect();

/*Initiates a connection to the MQTT broker*/
function Connect(){
    client.connect({
    onSuccess: Connected,
    onFailure: ConnectionFailed,
    //keepAliveInterval: 10,
    //userName: username,
    //useSSL: true,
    //password: password
    });
}

/*Callback for successful MQTT connection */
function Connected() {
    console.log("Connected");
    client.subscribe(sus);
}

/*Callback for failed connection*/
function ConnectionFailed(res) {
    console.log("Connect failed:" + res.errorMessage);
}

/*Callback for lost connection*/
function ConnectionLost(res) {
    if (res.errorCode !== 0) {
        console.log("Connection lost:" + res.errorMessage);
        Connect();
    }
}

/*Callback for incoming message processing */ // messages machen
function MessageArrived(message) {
    //console.log(message.destinationName +" : " + message.payloadString);
    
    if(onPage){
        var mes  = JSON.parse(message.payloadString);
        
        if(mes.info == "newNews4Today"){
             console.log("komme hier rein");
             console.log("result");
             console.log(result);
             console.log("mes");
             console.log(mes);
             for(var i = 0; i <mes.data[0].articles.length; i++){
                for(var j = 0; j< realResult[0].articles.length; j++){
                    if(mes.data[0].articles[i].title == realResult[0].articles[j].title){
                        console.log("zum splicen");
                        mes.data[0].articles.splice(i, 1);
                    }
                }
             }
             console.log("hier die länge des einzufügenen Arrays"+mes.data[0].articles.length);
             if(mes.data[0].articles.length >0){
                for(var i = 0; i <mes.data[0].articles.length; i++){
                    realResult[0].articles.unshift(mes.data[0].articles[i]);
                    // aktualisieren anzeige
                    
                }
                setNewsToday(realResult);
             }

            
            // console.log(result);
            //getNewsToday(setNewsToday);
            
        }
        
    }
    

    
}







async function getNewsToday(callback){
    console.log("komme in function getNewsToday");
    
    
    try{
        let response = await fetch('/data/news');
        
        //reads response stream to completion
        result = await response.text();
        result = JSON.parse(result);
        console.log("results werden bekommen"+result);
        console.log(result);
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
        //callback(result);
        console.log("getNewsToday:");
        console.log(result);

        // //wegmachen_ nur zum test
        // console.log(" hier ist länge vor push"+result.length);
        // var test = result;
        // console.log("ausgabe test");
        // console.log(test);
        // result.push(test[0]);
        // console.log("nach  push"+result.length);
        // result[1].articles[0].title="ES HAT GEKLAPPT";
        // console.log("neue result");
        // console.log(result);
        realResult = JSON.parse(JSON.stringify(result));
         callback(result);
    }

}
//Error: JSON {"error":true,"no_data_from":"X"}
function test(){
    var testarray= [];
    for(var i=0; i < result[0].articles.length;i++){
        var testarray = (result[0].articles[i]);
    }
    
   //var a= result[0].articles.push(result[0].articles);
   console.log("testausgeben"); 
   console.log(result);
    console.log(testarray);
    result.push(testarray);
    console.log(result);
    /*
    var a =document.getElementById("U1").innerHTML = "inhalt von dem ersten unterschrieb";
    //a.innerHTML ="hallo";
    //a.innerHTML= "Titel:titel titel <br> <p> inhalt </p>"; 
    // b=document.getElementById("BE1").textContent="Beschreibung: es war einmal ein Baum er hatte blätter" ;
    //c=document.getElementById("IN1").textContent="Das ist der Inhalt";  
    //d=document.getElementById("A1").textContent="Authorangabe";
    //e=document.getElementById("U1").textContent="hier uri einfügen"; 
    //console.log(a +" : "+b+" : "+c +" : "+d+" : "+e);  
     // console.log(a.innerHTML +" : "+" : "+c +" : "+d+" : "+e);  
    var a= document.createElement("p");
    a.textContent="zusammenfassudfnöerihdlrkg";
    document.getElementById("US1").appendChild(a);
    var b = document.getElementById("zusa");
    b.textContent="wurde geändert";
    console.log("hier ist b"+b);
    */
}

/*
<details>
    <summary > <b id ="US1" >erste überschrift</b>   <br> <p id ="BE1">  Zusammenfassung Punkt 1</p> </summary>
    <p id ="IN1">Inhalt</p>
    <p id="A1">Author</p>
    <p id="U1">Uri</p>
</details>
*/

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
    //}
    // var laenge
    // if(result[0].articles.length<6){
    //     laenge=result[0].articles.length;
    // }
    // else {
    //     laenge=5;
    // }

    //     console.log("die länge der artikelliste"+result[0].articles.length);
    //     for(var i =0;i <5; i++){
    //         var art = buildNewsblock(result[0].articles[i]);
    //         var section =document.getElementsByTagName("section")[0];
    //         section.appendChild(art);
    //     }
        
    
    /*
    // umschreiben für die richtigen daten
    //erste News 
    //var a= document.createElement("p");
    //a.textContent="zusammenfassudfnöerihdlrkg";
    //document.getElementById("US1").appendChild(a);
    //var b = document.getElementById("zusa");
    //console.log(b);
    //.textContent="erste überschrift  <br> <p >  Zusammenfassung Punkt 1</p>"; 
    var a=document.getElementById("US1").textContent= result[0].articles[0].title;
    console.log("hier ist result"+a);
    //document.getElementById("BE1").textContent="Beschreibung: es war einmal ein Baum er hatte blätter" ;
    document.getElementById("IN1").textContent="Das ist der Inhalt";  
    document.getElementById("A1").textContent="Authorangabe";
    document.getElementById("U1").textContent="hier uri einfügen"; 
    //console.log(a +" : "+b+" : "+c +" : "+d+" : "+e);
    */
}

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


/*
<details>
    <summary > <b id ="US1" >erste überschrift</b>   <br> <p id ="BE1">  Zusammenfassung Punkt 1</p> </summary>
    <p id ="IN1">Inhalt</p>
    <p id="A1">Author</p>
    <p id="U1">Uri</p>
</details>
*/


function buildNewsblock(artikel,datum){
    //console.log("buildnewsblock");
    //console.log(artikel);

    //vorbereitung
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

function buttonManager(){
    if(result != undefined && anzahlArtikel>=6){
        zweiSeiten=true;
        //buttens aktivieren
        document.getElementById("zuruck").disabled=true;
        document.getElementById("seite2").disabled=false;
        document.getElementById("zuruck").style.display='inline-block';
        document.getElementById("seite2").style.display='inline-block';
        
    }
    else{
        //console.log("buttonmanager: buttons deaktivbiert")
        zweiSeiten =false;
        //buttons deaktivieren
        document.getElementById("zuruck").disabled=true;
        document.getElementById("seite2").disabled=true;
        document.getElementById("zuruck").style.display='none';
        document.getElementById("seite2").style.display='none';
    }
}


function aufSeite1(){ // wenn auf button zurück geklickt wird
    //alle details entfernen
    var z =document.getElementsByTagName("details").length;
    console.log("Seite2 wechsel auf seite 1: hier ist länge von details"+z);
    for(var o= 0; o< z; o++){
        var e= document.getElementsByTagName("details")[0];
        console.log(e);
        e.remove();
    }

    //details wieder einfügen
    /*
    l= result[0].articles.length
        for(var i =0;i <5; i++){
            var art = buildNewsblock(result[0].articles[i]);
            var section =document.getElementsByTagName("section")[0];
            section.appendChild(art);
        }
    */
    setNewsToday(result);
    
    document.getElementById("zuruck").disabled=true;
    document.getElementById("seite2").disabled=false;
    
}

function aufSeite2(){
    //details entfernen
    var z =document.getElementsByTagName("details").length;
    console.log("Seite1 auf seite 2: hie ist länge von details"+z);
    for(var o= 0; o< z; o++){
        var e= document.getElementsByTagName("details")[0];
        console.log(e);
        e.remove();
    }

    // console.log("function auf Seite 2: die länge der artikelliste"+result[0].articles.length);
    // l= result[0].articles.length
    //     for(var i =5;i <l; i++){
    //         var art = buildNewsblock(result[0].articles[i]);
    //         var section =document.getElementsByTagName("section")[0];
    //         section.appendChild(art);
    // }
    var eingefügteArtikel=0;
    var spring=0;
        for(var j=0; j<anzahlArrays; j++){
            console.log("wechsel auf seite2: mit Array result"+j);
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

//scrollbarer header: vill rausnehmen

// When the user scrolls the page, execute myFunction
//window.onscroll = function() {myFunction()};
// Add the sticky class to the header when you reach its scroll position. Remove "sticky" when you leave the scroll position
function myFunction() {
    //console.log("window.sdfr" + window.pageYOffset + "sticky"+ sticky);
  if (window.pageYOffset > sticky) {
    header.classList.add("sticky");
    //console.log("List" + header.classList);
  } else {
    header.classList.remove("sticky");
  }
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
    }
}