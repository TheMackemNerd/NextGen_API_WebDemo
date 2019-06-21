function setUserName() {    

    console.log("User Cookie: " + Cookies.get("user"));
    if (Cookies.get("user") != undefined) { 
        var name = Cookies.get("user").name;
        document.getElementById("username").innerHTML = "User: " + name;
    }

}

function setTenant() {
    
    if (Cookies.get("user") != undefined) {
        var tenant = Cookies.get("user").tenant;
        document.getElementById("tenant").innerHTML = "Tenant: " + tenant;
    }

}
