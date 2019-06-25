function doData() {

    doDataPull();
}


function doDataPull() {

    console.log("Retrieving Access Token");
    var token = getCookie("accesstoken");

    console.log("Retrieving User");
    if (getCookie("user") != null) {
        console.log("User Cookie retrieved");
        var tenant = JSON.parse(getCookie("user")).tenant;
    }
    else {
        console.log("No user cookie can be found so we cannot get the tenancy");
        throw("Cannot determine your Tenant ID");
    }

    console.log("Getting URL Parameters");
    var urlParams = new URLSearchParams(window.location.search);
    var queryTenant = urlParams.get('tenant');


    if (tenant == queryTenant) {
        document.getElementById("clientSideCheck").innerHTML = "Client side check determined that the tenant being queried is the same as the user.";
    }
    else {
        document.getElementById("clientSideCheck").innerHTML = "You should never see this message. Tenant of the user doesn't match the query; the back-end API should block this call.";
    }

    var request = new XMLHttpRequest();

    console.log("Query Tenant: " + queryTenant);
    request.open('GET', 'https://2y3ps0tqaj.execute-api.eu-west-1.amazonaws.com/poc/tenants?id=' + queryTenant,true);
    request.setRequestHeader("Authorization", token);
    request.setRequestHeader("Content-Type", "text/plain");
    request.onload = function () {

        if (request.status != 200) {
            console.log("The API returned an error");
            var err = JSON.parse(this.response).message;
            console.log(err);
            window.location.replace("error.html?errordesc=" + encodeURI(error));
        }
        else {
            console.log("API call Success");
            var data = this.response;            
            document.getElementById("responseText").innerHTML = JSON.parse(data).description;

        }

    }

    request.send();

}