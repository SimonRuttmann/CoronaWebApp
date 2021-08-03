//error bearbeiten noch

window.onload = init();
var header;
var sticky;

function init(){
    getSessionData([setLoginStatus]);
    //getNewsToday([setNewsToday]);
    
    header = document.getElementById('kopf');
    console.log("header" + header);
    sticky = header.offsetTop;
};
// mqtt hier hinzufügen:

test();
function getNewsToday(callback){
    let result;
    try{
        let response = await fetch('/data/news');
        
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
function test(){
    var a =document.getElementById("U1").innerHTML;
    //a.innerHTML ="hallo";
    //a.innerHTML= "Titel:titel titel <br> <p> inhalt </p>"; 
   // b=document.getElementById("BE1").textContent="Beschreibung: es war einmal ein Baum er hatte blätter" ;
    c=document.getElementById("IN1").textContent="Das ist der Inhalt";  
    d=document.getElementById("A1").textContent="Authorangabe";
    e=document.getElementById("U1").textContent="hier uri einfügen"; 
    //console.log(a +" : "+b+" : "+c +" : "+d+" : "+e);  
    console.log(a.innerHTML +" : "+" : "+c +" : "+d+" : "+e);  
}

function setNewsToday(result){
    // umschreiben für die richtigen daten
    //erste News 
    document.getElementById("US1").textContent="Titel:titel titel"; 
    document.getElementById("BE1").textContent="Beschreibung: es war einmal ein Baum er hatte blätter" ;
    document.getElementById("IN1").textContent="Das ist der Inhalt";  
    document.getElementById("A1").textContent="Authorangabe";
    document.getElementById("U1").textContent="hier uri einfügen"; 
    //console.log(a +" : "+b+" : "+c +" : "+d+" : "+e);
    
    //zweite News
    document.getElementById("US2").textContent="Titel:titel titel"; 
    document.getElementById("BE2").textContent="Beschreibung: es war einmal ein Baum er hatte blätter" ;
    document.getElementById("IN2").textContent="Das ist der Inhalt";  
    document.getElementById("A2").textContent="Authorangabe";
    document.getElementById("U2").textContent="hier uri einfügen"; 
    //console.log(a +" : "+b+" : "+c +" : "+d+" : "+e);

    //dritte News
    document.getElementById("US3").textContent="Sie sind angemeldet als: "; 
    document.getElementById("US3").textContent="Titel:titel titel"; 
    document.getElementById("BE3").textContent="Beschreibung: es war einmal ein Baum er hatte blätter" ;
    document.getElementById("IN3").textContent="Das ist der Inhalt";  
    document.getElementById("A3").textContent="Authorangabe";
    document.getElementById("U3").textContent="hier uri einfügen"; 
    //console.log(a +" : "+b+" : "+c +" : "+d+" : "+e);

    //vierte News
    document.getElementById("US4").textContent="Titel:titel titel"; 
    document.getElementById("BE4").textContent="Beschreibung: es war einmal ein Baum er hatte blätter" ;
    document.getElementById("IN4").textContent="Das ist der Inhalt";  
    document.getElementById("A4").textContent="Authorangabe";
    document.getElementById("U4").textContent="hier uri einfügen"; 
    //console.log(a +" : "+b+" : "+c +" : "+d+" : "+e);

    //fünfte News
    document.getElementById("US5").textContent="Titel:titel titel"; 
    document.getElementById("BE5").textContent="Beschreibung: es war einmal ein Baum er hatte blätter" ;
    document.getElementById("IN5").textContent="Das ist der Inhalt";  
    document.getElementById("A5").textContent="Authorangabe";
    document.getElementById("U5").textContent="hier uri einfügen"; 
    //console.log(a +" : "+b+" : "+c +" : "+d+" : "+e);
}

//scrollbarer header: vill rausnehmen
// When the user scrolls the page, execute myFunction
window.onscroll = function() {myFunction()};
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
