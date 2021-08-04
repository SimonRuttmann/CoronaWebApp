window.onload = init();

var session = {
    authenticated: false,
    name: "",
    email: "",
}


function init(){
    getSessionData([setLoginStatus, setSession, toggleSendButton]);
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
        document.getElementById("loginStatus").textContent=`Sie sind angemeldet als: ${data.name}`;     
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

function toggleSendButton(data){
    var sendElements = document.getElementsByClassName("send");
    if(data.authenticated){
        for (let element of sendElements) {
            element.style.visibility = "visible";
            element.removeAttribute("disabled");
        }
    }
    else{
        for (let element of sendElements) {
			element.style.visibility = "hidden";
            element.setAttribute("disabled", true);
        }
    }
}

function sendMessage(){
    console.log("should send message")
}