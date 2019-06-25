function doData() {

    doDataPull(function (error, result) {

        if (error) {
            window.location.replace("error.html?errordesc=" + encodeURI(error));
        }
        else {
            document.getElementById("responseText").innerHTML = JSON.parse(result).description;
        }
    });
}


function doDataPull(callback) {

    console.log("Entering doDataPull");

    console.log("Retrieving Access Token");
    var token = getCookie("accesstoken");

    console.log("Retrieving User");
    if (getCookie("user") != null) {
        console.log("User Cookie retrieved");
        var tenant = JSON.parse(getCookie("user")).tenant;
    }
    else {
        console.log("No user cookie can be found so we cannot get the tenancy");
        window.location.replace("error.html?errordesc=" + encodeURI("Cannot determine your Tenant ID"));
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

    console.log("Preparing to call API");
    console.log("Query Tenant: " + queryTenant);
    request.open('GET', 'https://2y3ps0tqaj.execute-api.eu-west-1.amazonaws.com/poc/tenant?id=' + queryTenant,true);
    //request.open('GET', 'https://ec2-34-244-123-54.eu-west-1.compute.amazonaws.com:3000/api/v1/tenant?id=' + queryTenant, true);
    //request.withCredentials = true;
    request.setRequestHeader("Authorization", token);
    //request.setRequestHeader("X-USER", usertoken);
    request.setRequestHeader("Content-Type", "application/json");
    //request.setRequestHeader("Origin", "https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com");
    request.onload = function () {

        if (request.status != 200) {
            console.log("The API returned an error");
            var err = JSON.parse(this.response).message;
            console.log(err);
            callback(err)
        }
        else {
            console.log("API call Success");
            var data = this.response;            
            callback(null, data)
        }

    }

    request.send();

}