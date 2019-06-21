function setUserName() {

    console.log("Cookie: " + Cookies.get("user"));
    if (Cookies.get("user") != null) { 
        var name = Cookies.get("user").name;
        document.getElementById("username").innerHTML = "User: " + name;
    }

}

function setTenant() {

    var tenant = Cookies.get("user").tenant;
    document.getElementById("tenant").innerHTML = "Tenant: " + tenant;

}
