window.onload = init();

async function init(){
    await getSessionData([setLoginStatus, setSession]);
    getUserData();
};

async function getUserData(){
    
    let result;
    try{
        let response = await fetch('/user/getUserData');
        if(response.status != 200) {
            console.log("Received status: " + response.status);
            return;
        }
        
        //reads response stream to completion
        result = await response.text();
        console.log(result);
        result = JSON.parse(result);
        
    }
    catch(e){
        console.log("Server is not responing");
    }
    if (result != undefined){
        profile.gender = result.gender;
        profile.priority = result.priority;
        profile.prefVaccine = result.prefVaccine;
        profile.district = result.district;
        profile.radius = result.radius;
        session.name = result.name;
        session.email = result.name;
        updateProfileDOM();
    }

}



async function getSessionData(callbacks){
    return new Promise( async(resolve, reject) => {
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
            reject(e);
        }
        if (result != undefined){
            callbacks.forEach( callback => callback(result))
        }
        resolve(true);
    })
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
    document.getElementById("nameOutput").value = session.name;
    document.getElementById("emailOutput").value = session.email;

    let genderTranslated;
    switch(profile.gender){
        case "male":      genderTranslated = "Männlich";      break;
        case "female":    genderTranslated = "Weiblich";      break;
        case "diverse":   genderTranslated = "Divers";        break;
        case "unknown":   genderTranslated = "Keine Angabe";  break;
    }
    document.getElementById("genderOutput").value = genderTranslated;
    
    let priorityTranslated;
    switch(profile.priority){
        case "priority1": priorityTranslated = "Gruppe 1 - Höchste Priorität";    break;
        case "priority2": priorityTranslated = "Gruppe 2 - Hohe Priorität";       break;
        case "priority3": priorityTranslated = "Gruppe 3 - Erhöhte Priorität";    break;
        case "priority4": priorityTranslated = "Gruppe 4 - Keine Priorität";      break          
    }    
    document.getElementById("priorityOutput").value = priorityTranslated;

    let vaccineTranslated;
    switch(profile.prefVaccine){
        case "everything":    vaccineTranslated = "Alle zug. Impfstoffe"; break;
        case "biontech":      vaccineTranslated = "Biontech/Pfizer";      break;
        case "moderna":       vaccineTranslated = "Moderna";              break;
        case "astra":         vaccineTranslated = "AstraZeneca";          break;
        case "johnsen":       vaccineTranslated = "Johnson&amp;Johnson";  break;              
    }
    document.getElementById("vaccineOutput").value = vaccineTranslated;
    document.getElementById("districtOutput").value = profile.district;

    let radiusTranslated;
    switch(profile.radius){
        case "all":   radiusTranslated = "Ganz Baden-Württemberg";   break;
        case "one":   radiusTranslated = "Mein Landkreis";   break;
        case "surr":  radiusTranslated = "Main und alle umliegenden Landkreise";  break;
    }
    document.getElementById("radiusOutput").value = radiusTranslated;

}

async function sendToServer(){
    let result;
    console.log(profile);
    try{
        let response = await fetch('/user/updateUser',{
            method: 'POST',
            headers:{'Content-Type': 'application/json'},
            body: JSON.stringify(profile)
        });

        if(response.status != 200) {
            console.log("Received status: " + response.status);
            return;
        }
    
        //reads response stream to completion
        result = await response.text();
        result = JSON.parse(result);
        console.log(result);
        if(!result.updated){
            console.log("Serverside error at handling update")
        }
        
    }
    catch(e){
        console.log("Server is not responing");
    }
};

function getProfile(){
    profile.gender = document.getElementById("gender").value;
    profile.priority = document.getElementById("priority").value;
    profile.prefVaccine = document.getElementById("vaccine").value;
    profile.district = document.getElementById("district").value;
    profile.radius = document.getElementById("radius").value;
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
    biontech    BOOLEAN,
    moderna     BOOLEAN,
    astra       BOOLEAN,
    johnson     BOOLEAN,
    latitude    VARCHAR(40) DEFAULT '0',
    longitude   VARCHAR(40) DEFAULT '0',
    city        VARCHAR(255) DEFAULT 'none',
    radius      INTEGER,   
    PRIMARY KEY (id)
);
*/