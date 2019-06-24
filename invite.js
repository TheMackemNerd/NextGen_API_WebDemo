function doInvite() {

    var user = sessionStorage.getItem("user");
    var tenant = JSON.parse(JSON.parse(user)).tenant;

    var urlParams = new URLSearchParams(window.location.search);
    var emailaddress = urlParams.get('emailaddress');
    var fullname = urlParams.get('fullname');

    var data = "{ 'email': " + emailaddress + "', 'name' : '" + fullname + "', 'tenant':'" + tenant + "'}";

    var request = new XMLHttpRequest();

    request.open('POST', 'https://2y3ps0tqaj.execute-api.eu-west-1.amazonaws.com/poc/users');
    console.log("Authorization: " + sessionStorage.getItem("encodedtoken"));
    request.setRequestHeader("Authorization", sessionStorage.getItem("encodedtoken"));
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader("Access-Control-Allow-Origin", "https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com");

    request.onload = function () {

        if (request.status == 200 || request.status == 201) {
            console.log("API call Success");

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