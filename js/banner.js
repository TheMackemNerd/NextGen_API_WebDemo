function setUserName() {

    console.log(sessionStorage.getItem("user"));
    var user = sessionStorage.getItem("user");
    var name = JSON.parse(JSON.parse(user)).name;
    document.getElementById("username").innerHTML = "User: " + name;

}

function setTenant() {

    console.log(sessionStorage.getItem("user"));
    var user = sessionStorage.getItem("user");
    var tenant = JSON.parse(JSON.parse(user)).tenant;
    document.getElementById("tenant").innerHTML = "Tenant: " + tenant;

}
