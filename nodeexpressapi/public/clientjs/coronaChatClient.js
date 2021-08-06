
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
    await getSessionData([setLoginStatus, setCredentials, toggleSendButton]);
    await initializeWebsocket();
    authorize();
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

function initializeWebsocket(){
    return new Promise( (resolve, reject) => {
        if (ws) {
            ws.onerror = ws.onopen = ws.onclose = null;
            ws.close();
          }
      
        ws = new WebSocket('ws://localhost:6969');
          
        ws.onopen = () => {   console.log('Connection opened!'); resolve(true);  }
        ws.onmessage = receiveMessage(messageFromServer);
        ws.onclose = function() { ws = null;  }
        
        socket = new WebSocket('ws://localhost:3000')
    })

   
   
}

function authorize(){
    if(credentials.authenticated){

        var cred = {
            email:      credentials.email,
            name:       credentials.name,
            password:   credentials.password,
        }

        var sendingObject = {};
        sendingObject.type = "authorize";
        sendingObject.credentials = cred;

        // var send = 
        // `{
        //     "type":     "authorize"
        //     "credentials": 
        //     {
        //         "email":      "${credentials.email}",
        //         "name":       "${credentials.name}"
        //         "password":   "${credentials.password}"
        //     }
        // }`   

        ws.send(JSON.stringify(send));
    }
    
}


function setGeneralTopic()      {  changeTopic(topics.GENERAL);      }
function setVaccinateTopic()    {  changeTopic(topics.VACCINATE);    }
function setQuarantineTopic()   {  changeTopic(topics.QUARANTINE);   }
function setTestTopic()         {  changeTopic(topics.TEST);         }
function setExperienceTopic()   {  changeTopic(topics.EXPERIENCE);   }

function changeTopic(top){
    topic = top;
    clearChatbox(); 
    clearUsers(); 
    sendTopic();
}

function clearChatbox(){
    var chatBox = document.getElementsByClassName("scrollableChat")[0];
    chatBox.innerHTML = "";
}

function clearUsers(){
    var userList = document.getElementsByClassName("userList")[0];
    userList.innerHTML = "";
}

function sendTopic(){
    var sendingObject = {
        type: "topic",
        topic: topic
    }
}

function sendMessage(){
    var messageToSend = document.getElementById("sendingField").value;
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
    
    // message
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
    
    ws.send(sendingObject);
}

function receiveMessage(message){
    var receivedObject = JSON.parse(message);
    
    switch (receiveMessage.type){
        case "prevMessages": 
            receivedObject.messages.forEach(mess => {
                if(mess.meta.topic != topic) return;
                displayMessage(mess.message, mess.meta.time, mess.meta.username);
            })
            break;
        case "activeUsers":
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
    /*
    
		        <div class="container-dark">
  			        <p>Guten Morgen. Hier ist ein Chat</p>
  			        <span class="chatmeta-left">11:01 - oleg</span>
		        </div>

    */

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
    chatBox.appendchild(container);

    containerColourWhite = !containerColourWhite;
}


function displayUser(username){
    var userList = document.getElementsByClassName("userList")[0];
    activeUser = document.createElement("li");
    activeUser.innerText = username;
    userList.appendChild(activeUser)
}

//Chrome-Browser BuildIn WebSockets
//socket = new WebSocket('ws://localhost:3000')
//socket.onmessage = function(message){ console.log(message)}
//socket.send("Hallo vom Client")

/*

(function() {
    const sendBtn = document.querySelector('#send');
    const messages = document.querySelector('#messages');
    const messageBox = document.querySelector('#messageBox');

    let ws;

    function showMessage(message) {
      messages.textContent += `\n\n${message}`;
      messages.scrollTop = messages.scrollHeight;
      messageBox.value = '';
    }

    function init() {
      if (ws) {
        ws.onerror = ws.onopen = ws.onclose = null;
        ws.close();
      }

      ws = new WebSocket('ws://localhost:6969');
      ws.onopen = () => {
        console.log('Connection opened!');
      }
      ws.onmessage = ({ data }) => showMessage(data);
      ws.onclose = function() {
        ws = null;
      }
    }

    sendBtn.onclick = function() {
      if (!ws) {
        showMessage("No WebSocket connection :(");
        return ;
      }

      ws.send(messageBox.value);
      showMessage(messageBox.value);
    }

    init();
  })();
*/