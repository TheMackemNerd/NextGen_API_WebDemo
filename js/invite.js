function doInvite() {

    console.log("Entering doInvite");

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
    var emailaddress = urlParams.get('emailaddress');
    var fullname = urlParams.get('fullname');

    var data = "{ 'email': " + emailaddress + "', 'name' : '" + fullname + "', 'tenant':'" + tenant + "'}";

    console.log("Creating API Call");
    var request = new XMLHttpRequest();
    request.open('POST', 'https://2y3ps0tqaj.execute-api.eu-west-1.amazonaws.com/poc/users');
    request.setRequestHeader("Authorization", token);
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader("Origin", "https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com");

    request.onload = function () {

        console.log("Performing API Callback");

        if (request.status == 200 || request.status == 201) {
            console.log("API call Success: " + JSON.stringify(request.data));

        }
        else {
            console.log("The API returned an error");
            var err = JSON.parse(this.response).message;
            console.log(err);
            window.location.replace("error.html?errordesc=" + encodeURI(err));
        }

    }

    console.log("Calling API");
    request.send(data);

}