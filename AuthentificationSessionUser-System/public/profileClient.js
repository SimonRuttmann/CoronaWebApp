window.onload = init();

function init(){
    getSessionData([setLoginStatus, setSession]);
};

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

function setSession(data){
    if(data.authenticated){
        session.authenticated = data.authenticated;
        session.name = data.name;
        session.email = data.email;
    }
}

function sendProfile(){
  getProfile();
  sendToServer();
  updateProfileDOM();
}

function updateProfileDOM(){
    Document.getElementById("nameOutput").value = session.name;
    Document.getElementById("emailOutput").value = session.email;

    let genderTranslated;
    switch(profile.gender){
        case male:      genderTranslated = "Männlich"; break;
        case female:    genderTranslated = "Weiblich"; break;
        case diverse:   genderTranslated = "Divers"; break;
        default:        genderTranslated = "Keine Angabe"; break;
    }
    Document.getElementById("genderOutput").value = genderTranslated;
    
    
  /*  
    Document.getElementById("priorityOutput").value
    Document.getElementById("vaccineOutput").value
    Document.getElementById("districtOutput").value
    Document.getElementById("radiusOutput").value
*/
}

function sendToServer(){
    let result;
    try{
        let response = await fetch('/user/getSessionInfo',{
            method: 'POST',
            header:{'Content-Type': 'text/plain'},
            body: JSON.parse(profile)
        });

        if(response.status != 200) {
            console.log("Received status: " + response.status);
            return;
        }
    
        //reads response stream to completion
        result = await response.text();
        result = JSON.parse(result);
        
        if(!result.valid){
            console.log("Serverside error at handling update")
        }
        
    }
    catch(e){
        console.log("Server is not responing");
    }
    if (result != undefined){
        callbacks.forEach( callback => callback(result))
    }
};

function getProfile(){
    profile.gender = document.getElementById("gender").value();
    profile.priority = document.getElementById("priority").value();
    profile.prefVaccine = document.getElementById("prefVaccine").value();
    profile.district = document.getElementById("district").value();
    profile.radius = document.getElementById("radius").value();
}

var profile = {
    gender:     "unkown",
    priority:   "priority4",
    prefVaccine:"everthing",
    district:   "unknown",
    radius:     "all"
}

var session = {
    authenticated: false,
    name: "",
    email: "",
}

/*
gender = ${req.body.gender}, 
priority = ${req.body.priority}, 
prefVaccine = ${req.body.prefVaccine},
district = ${req.body.district},
radius = ${req.body.radius},
WHERE  id = ${req.body.id};

CREATE TABLE IF NOT EXISTS Account (
    id          VARCHAR(255),
    name        VARCHAR(255) NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    gender      ENUM('unkown', 'male', 'female', 'diverse')  DEFAULT 'unknown', 
    priortiy    VARCHAR(30)  DEFAULT 'priority4',
    prefVaccine VARCHAR(50)  DEFAULT 'everything',
    district    VARCHAR(255) DEFAULT 'unkown',
    radius      ENUM('all', 'surrounding', 'one')  DEFAULT 'all',   
    PRIMARY KEY (id)
);
*/