
/* BANNER FUNCTIONS
 * Used to set the User name and Tenant values at the top of each page
 */

function setUserName() {
    try {
        if (getLocalVariable("user") != null) {
            var name = JSON.parse(getLocalVariable("user")).name;
            document.getElementById("username").innerHTML = "User: " + name;
        }
    }
    catch (e) {
        throw e;
    }
}

function setTenant() {
    try {   
    if (getLocalVariable("user") != null) {
        var tenant = JSON.parse(getLocalVariable("user")).tenant;
        document.getElementById("tenant").innerHTML = "Tenant: " + tenant;
    }
}
    catch (e) {
    throw e;
}
}