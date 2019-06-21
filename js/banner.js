function setUserName() {    


    if (getCookie("user") != null) { 
        var name = getCookie("user").name;
        document.getElementById("username").innerHTML = "User: " + name;
    }

}

function setTenant() {
    
    if (getCookie("user") != null) {
        var tenant = getCookie("user").tenant;
        document.getElementById("tenant").innerHTML = "Tenant: " + tenant;
    }

}