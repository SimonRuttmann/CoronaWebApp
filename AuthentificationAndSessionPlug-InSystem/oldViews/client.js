

function register(){
    var oform = document.forms["registerform"];
    var url = "/register"
    submitForm(oform, url);
    showLogin();
}

function submitForm(form, url){
    
    //var url = form.attr("action");
    var formData = {};
    
    $(form).find("input[name]").each(function (index, node) {
        formData[node.name] = node.value;
    });
    $.post(url, formData).done(function (data) {
        alert(data);
    });
    
}



function login(){
    var url = "/login"
    var oform = document.forms["loginform"]
    submitForm(oform,url)
    
}

function showLogin(){
    document.getElementById("authenticationContainer").innerHTML =
    '   <div id = loginContainer">'
    +'      <h1>Login</h1>'
    +'      <form action="/login" name="loginform" method="POST">'
    
    +'          <div>'
    +'              <label for = "email"> E-Mail </label>'
    +'              <input type = "email", id = "email", name = "email">'
    +'          </div>'
    
    +'          <div>'
    +'              <label for = "password"> Passwort </label>'
    +'              <input type = "password", id = "password", name = "password">'
    +'          </div>'

    +'      </form>'
    +'      <button id="Login" onclick="login()"> Anmelden </button>'
    +'      <button id="ToRegister" onclick ="showRegister()"> Zur Registrierung </button>'
    +'</div>'
}

function showRegister(){
    document.getElementById("authenticationContainer").innerHTML =
    '   <div id = registerContainer">'
    +'      <h1>Registrierung</h1>'
    +'      <form action="/register" name="registerform" method="POST">'
    +'            <div>'
    +'                <label for = "name"> Name </label>'
    +'                <input type = "text", id = "name", name = "name">'
    +'            </div>'

    +'          <div>'
    +'              <label for = "email"> E-Mail </label>'
    +'              <input type = "email", id = "email", name = "email">'
    +'          </div>'
    
    +'          <div>'
    +'              <label for = "password"> Passwort </label>'
    +'              <input type = "password", id = "password", name = "password">'
    +'          </div>'
    +'      </form>'
    +'      <button id="Register" onclick="register()"> Registrierung </button>'
    +'      <button id="ToLogin" onclick ="showLogin()"> Zur Anmeldung </button>'
    +'</div>'
}


//window.onload= async function register(){
//    alert("Sending data");
//    var data = {name: 'admin', email: 'admin@mail', password: 'password'}
//    let sendRegister = await fetch ('http://localhost:3000/register',
 //   {   
  //      method: 'POST',
   //     headers: {'Content-Type': 'application/json'},
    //    body: JSON.stringify(data)
   // })
   // alert ("Received")
   // console.log(sendRegister);
//}

