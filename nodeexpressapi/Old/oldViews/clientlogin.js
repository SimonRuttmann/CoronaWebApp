
function register(){
    alert("call");
    var oform = document.forms["regis"];
   submitForm(oform);


    
}

function submitForm(form){
   // var url = form.attr("action");
   url = "/login"
    alert("url = " + url.toString())
    var formData = {};
    $(form).find("input[name]").each(function (index, node) {
        formData[node.name] = node.value;
    });
    $.post(url, formData).done(function (data) {
        alert(data);
    });
}
