
window.onload = init();

var credentials = {
    authenticated: false,
    name: "",
    email: "",
    password: "",
}
var ws;
const topics = {
    GENERAL:    "general",
    VACCINATE:  "vaccinate",
    QUARANTINE: "quarantine",
    TEST:       "test",
    EXPERIENCE: "experience"
}

var topic = topics.GENERAL;
var containerColourWhite = true;

async function init(){
    await getSessionData([setLoginStatus, setCredentials, toggleSendButton, toggleUserlist]);
    await initializeWebsocket();
    await authorize();
    setGeneralTopic();
};


async function getSessionData(callbacks){
    let result;
    try{
        let response = await fetch('/user/getCredentials');
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

function setCredentials(data){
    if(data.authenticated){
        credentials.authenticated = data.authenticated;
        credentials.name = data.name;
        credentials.email = data.email;
        credentials.password = data.password
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

function toggleUserlist(data){
    if(data.authenticated){
        document.getElementsByClassName("user-box")[0].style.visibility = "visible";
    }
    else{
        document.getElementsByClassName("user-box")[0].style.visibility = "hidden";
    }
}

function initializeWebsocket(){
    return new Promise( (resolve, reject) => {
        if (ws) {
            ws.onerror = ws.onopen = ws.onclose = null;
            ws.close();
          }
      
        ws = new WebSocket('ws://localhost:6969');
          
        ws.onopen = () => {   console.log('Connection opened!'); resolve(true);  }
        ws.onmessage = (messageFromServer) => receiveMessage(messageFromServer.data);
        ws.onclose = function() { ws = null;  }
        
    })

}

async function authorize(){
    if(credentials.authenticated){

        var cred = {
            email:      credentials.email,
            name:       credentials.name,
            password:   credentials.password,
        }

        var sendingObject = {};
        sendingObject.type = "authorize";
        sendingObject.credentials = cred;
 
        await ws.send(JSON.stringify(sendingObject));
    }
    
}


function setGeneralTopic()      {  changeTopic(topics.GENERAL);      }
function setVaccinateTopic()    {  changeTopic(topics.VACCINATE);    }
function setQuarantineTopic()   {  changeTopic(topics.QUARANTINE);   }
function setTestTopic()         {  changeTopic(topics.TEST);         }
function setExperienceTopic()   {  changeTopic(topics.EXPERIENCE);   }

async function changeTopic(top){
    topic = top;
    changeDescription(top);
    clearChatbox(); 
    clearUsers(); 
    await sendTopic();
}

function changeDescription(top){
    var title;
    var description;
    switch(top){
        case topics.GENERAL:    
            title = "Sie sind im Allgmeinen-Thread";
            description = "Hier können Sie sich mit anderen Teilnehmern über allgmeine Themen unterhalten." 
            break;
        case topics.VACCINATE:
            title = "Sie sind im Impfen-Thread";
            description = "Hier können Sie sich mit anderen Teilnehmern über alles rund ums Impfen unterhalten." 
            break;
        case topics.QUARANTINE:
            title = "Sie sind im Quarantäne-Thread";
            description = "Hier können Sie sich mit anderen Teilnehmern über alles rund um die Quarantäne unterhalten." 
            break;
        case topics.TEST:
            title = "Sie sind im Test-Thread";
            description = "Hier können Sie sich mit anderen Teilnehmern über alles rund ums Testen unterhalten." 
            break;
        case topics.EXPERIENCE:
            title = "Sie sind im Erfahrungs-Thread";
            description = "Hier können Sie sich mit anderen Teilnehmern über bisherige Erfahrungen unterhalten." 
            break;                
    }
    document.getElementsByClassName("topic-title")[0].innerText = title;
    document.getElementsByClassName("topic-description")[0].innerText = description;
}

function clearChatbox(){
    var chatBox = document.getElementsByClassName("scrollableChat")[0];
    chatBox.innerHTML = "";
}

function clearUsers(){
    var userList = document.getElementsByClassName("userList")[0];
    userList.innerHTML = "";
}

async function sendTopic(){
    var sendingObject = {
        type: "topic",
        topic: topic
    }
    await ws.send(JSON.stringify(sendingObject));
}

function sendMessage(){
    var messageToSend = document.getElementById("sendingField").value;
    if (!messageToSend) return;

    document.getElementById("sendingField").value = "";
    
    var meta = {
        username:   credentials.name,
        time:       Date.now(),
        topic:      topic
    }
    var sendingObject = {};
    sendingObject.type = "message",
    sendingObject.meta = meta;
    sendingObject.message = messageToSend;
    
    //Json, which will be sent
    // {
    //     "type":       "message"
    //     "meta":
    //         {
    //             "username":   "albert",
    //             "time":       "12.01.2021/21:58:24",
    //             "topic":      "general"
    //         },
    //     "message":     "Hello there"
    // }
    
    ws.send(JSON.stringify(sendingObject));
}

function receiveMessage(message){

    var receivedObject = JSON.parse(message);
  
    switch (receivedObject.type){
        case "prevMessages":
            clearChatbox(); 
            receivedObject.messages.forEach(mess => {
                if(mess.meta.topic != topic) return;
                displayMessage(mess.message, mess.meta.time, mess.meta.username);
            })
            break;
        case "activeUsers":
            clearUsers();
            receivedObject.users.forEach(username => {
                displayUser(username);
            })
            break;
        case "message":
            if(receivedObject.meta.topic != topic) return;
            displayMessage(receivedObject.message, receivedObject.meta.time, receivedObject.meta.username);
    }
}

function displayMessage(message, time, username){
    /* Creates in HTML-style
		        <div class="container-dark">
  			        <p>Guten Morgen. Hier ist ein Chat</p>
  			        <span class="chatmeta-left">11:01 - oleg</span>
		        </div>
    */
    
    time = formatTime(time);
    var container = document.createElement("div");
    
    if(containerColourWhite)    container.setAttribute("class", "container-white");            
    else                        container.setAttribute("class", "container-dark");  

    var text = document.createElement("p");
    text.innerText = message;
    container.appendChild(text);

    var span = document.createElement("span");

    if(containerColourWhite)    span.setAttribute("class", "chatmeta-left");        
    else                        span.setAttribute("class", "chatmeta-right");
    
    span.innerText = `Von ${username} - Gesendet: ${time}`;

    container.appendChild(span);  

    var chatBox = document.getElementsByClassName("scrollableChat")[0];
    chatBox.appendChild(container);

    containerColourWhite = !containerColourWhite;
}


function displayUser(username){
    var userList = document.getElementsByClassName("userList")[0];
    activeUser = document.createElement("li");
    activeUser.innerText = username;
    userList.appendChild(activeUser)
}




  function formatTime(millis){
    var date = new Date(millis);
    var h = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();
    var d = date.getDay();
    h = addZeros(h); 
    m = addZeros(m); 
    s = addZeros(s); 
    d = setDay(d);
    return d + " um " + h + ":" + m + ":" + s;
  }

  
function setDay(val){
    switch(val){
      case 1: return "Montag";
      case 2:	return "Dienstag";
      case 3: return "Mittwoch";
      case 4: return "Donnerstag";
      case 5: return "Freitag";
      case 6: return "Samstag";
      case 0: return "Sonntag";
    }
  }

  function addZeros(val){
    if(val < 10) {
        val = "0" + val
    }
  return val;
}
