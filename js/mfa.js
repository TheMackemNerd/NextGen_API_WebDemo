function getMFAStatus() {

    console.log("Retrieving Access Token");
    var token = getLocalVariable("accesstoken");

    var request = new XMLHttpRequest();
    request.open('GET', 'https://2y3ps0tqaj.execute-api.eu-west-1.amazonaws.com/poc/users/me/mfa', true);
    request.setRequestHeader("Authorization", token);
    request.setRequestHeader("x-api-key", apiKey);
    request.setRequestHeader("Content-Type", "application/json");

    request.onload = function () {

        if (request.status != 200) {
            console.log("The API returned an error");
            var err = JSON.parse(this.response).message;
            console.log(err);
            window.location.replace("error.html?errordesc=" + encodeURI(err));
        }
        else {
            console.log("API call Success");
            var data = this.response;
            console.log(data);
            document.getElementById("mfaStatus").checked = JSON.parse(data).mfa_enabled;
            document.getElementById("mfaPhone").value = JSON.parse(data).phone_number;

        }

    }

    request.send();


}