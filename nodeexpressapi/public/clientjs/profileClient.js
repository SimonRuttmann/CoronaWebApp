window.onload = init();

var slider = document.getElementById("radius");
var output = document.getElementById("slidervalue");
output.innerHTML = slider.value + " km";

slider.oninput = function() {
  output.innerHTML = this.value + " km";
}

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
       
        session.name = result.name;
        session.email = result.email;
        
        profile.biontech = result.biontech;
        profile.moderna = result.moderna;
        profile.astra = result.astra;
        profile.johnson = result.johnson;
        profile.city = result.city;
        profile.radius = result.radius;
        profile.latitude = result.latitude;            
        profile.longitude = result.longitude;   
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

    let vaccineTranslated = "";
    if(profile.biontech) vaccineTranslated += "Biontech/Pfizer ";
    if(profile.moderna) vaccineTranslated += "Moderna ";
    if(profile.astra) vaccineTranslated += "AstraZeneca ";
    if(profile.johnson) vaccineTranslated += "Johnson&Johnson ";
    if(vaccineTranslated === "") vaccineTranslated = "Keine Angabe";

    document.getElementById("vaccineOutput").value = vaccineTranslated;
    document.getElementById("districtOutput").value = profile.district;
    document.getElementById("radiusOutput").value = profile.radius + " km";

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
    profile.biontech = document.getElementById("biontech").checked;
    profile.moderna = document.getElementById("moderna").checked;
    profile.astra = document.getElementById("astra").checked;
    profile.johnson = document.getElementById("johnson").checked;
    profile.city = document.getElementById("city").value;
    profile.radius = slider.value;
    profile.latitude = 0;               //TODO
    profile.longitude = 0;              //TODO
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

var session = {
    authenticated: false,
    name: "",
    email: "",
}

/*
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