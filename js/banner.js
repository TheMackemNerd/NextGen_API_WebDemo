function setUserName() {    

    if (getCookie("user") != null) { 
        var name = JSON.parse(getCookie("user")).name;
        document.getElementById("username").innerHTML = "User: " + name;
    }

}

function setTenant() {
    
    if (getCookie("user") != null) {
        var tenant = JSON.parse(getCookie("user")).tenant;
        document.getElementById("tenant").innerHTML = "Tenant: " + tenant;
    }

}