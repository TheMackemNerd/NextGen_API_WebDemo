function doInvite() {

    var token = getCookie("accesstoken");

    if (getCookie("user") != null) {
        var tenant = JSON.parse(getCookie("user")).tenant;
        document.getElementById("tenant").innerHTML = "Tenant: " + tenant;
    }
    else {
        console.log("No user cookie can be found so we cannot get the tenancy");
        window.location.replace("error.html?errordesc=" + encodeURI("Cannot determine your Tenant ID"));
    }

    var urlParams = new URLSearchParams(window.location.search);
    var emailaddress = urlParams.get('emailaddress');
    var fullname = urlParams.get('fullname');

    var data = "{ 'email': " + emailaddress + "', 'name' : '" + fullname + "', 'tenant':'" + tenant + "'}";

    var request = new XMLHttpRequest();

    request.open('POST', 'https://2y3ps0tqaj.execute-api.eu-west-1.amazonaws.com/poc/users');
    
    request.setRequestHeader("Authorization", token);
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader("Access-Control-Allow-Origin", "https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com");

    request.onload = function () {

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

    request.send(data);

}