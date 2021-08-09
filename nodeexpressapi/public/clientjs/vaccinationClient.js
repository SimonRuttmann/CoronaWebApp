window.onload = init();
var menuDisplay=false;

var slider = document.getElementById("radius");
var output = document.getElementById("slidervalue");
output.innerHTML = slider.value + " km";

slider.oninput = function() {
  output.innerHTML = this.value + " km";
}

function init(){
    getSessionData([setLoginStatus]);
    fillTable(); 
};


/*
<tr>
    <th>Impfzentrum</th>
    <th>Impfstoff</th>
    <th>Adresse</th>
    <th>BookingURL</th>
</tr>
*/
function fillTable(){

    var td = buildTD();
    var table = document.getElementById("tableID");
    table.appendChild(td);
}

function buildTD(){

    

        var a= document.createElement("td");
        a.textContent="test Impfzentrum";
        var b= document.createElement("td");
        b.textContent="test Impfstoff";
        var c= document.createElement("td");
        c.textContent="test Adresse";
        var d= document.createElement("td");
        d.textContent="test BookingURL";

    var dr = document.createElement("tr");

    dr.appendChild(a);
    dr.appendChild(b);
    dr.appendChild(c);
    dr.appendChild(d);
    
    console.log(dr);
    return dr;
}


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
