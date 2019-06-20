var tokenData = "";

function setUserName() {

    console.log(sessionStorage.getItem("user"));
    var user = sessionStorage.getItem("user");
    var name = JSON.parse(user).name;
    document.getElementById("username").innerHTML = name;

}

function isSecure() {
    if (!secureCheck()) {
        window.location.replace("https://hcm-hub-rnd.auth.eu-west-1.amazoncognito.com/login?response_type=token&client_id=57vo0lcv2gq0822td26v9nhnh6&redirect_uri=https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com/callback.html");
    }

}

function logOut() {
    sessionStorage.removeItem("userKey");
}

function secureCheck() {

    if (isInSession()) {
        return true;
    }
    else {

        var token = getToken();
        sessionStorage.setItem("encodedtoken", token);
        if (token === null) {
            return false;
        }
        else {
            if (parseJwt(token)) {

                console.log("Token Parse success");
                createSession();
                return true;
            }
            else {
                console.log("Token Parse failed");
                return false;
            }
        }
    }
}

function isInSession() {

    console.log("Checking Session State");

    var key = sessionStorage.getItem("userKey");
    if (key === null) {
        console.log("No Session Exists");
        return false;
    }
    else {
        console.log("Session Exists");
        return true;
    }

}

function createSession() {

    console.log("Creating Session");
    sessionStorage.setItem("userKey", tokenData.sub);
    sessionStorage.setItem("token", JSON.stringify(tokenData));

}

function getToken() {

    console.log("Getting Token");
    var frag = window.location.hash.substring(1);
    var result = frag.split('&').reduce(function (result, item) {
        var parts = item.split('=');
        result[parts[0]] = parts[1];
        return result;
    }, {});

    console.log(result);
    return result.id_token;

}

function parseJwt(token) {
    try {

        console.log("Parsing Token");
        const base64HeaderUrl = token.split('.')[0];
        const base64Header = base64HeaderUrl.replace('-', '+').replace('_', '/');
        const headerData = JSON.parse(window.atob(base64Header));

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace('-', '+').replace('_', '/');
        tokenData = JSON.parse(window.atob(base64));
        tokenData.header = headerData;

        // Checking if the Token has expired
        if (isTokenValid()) {
            console.log("Token is valid");
            return true;
        }
        else {
            console.log("Token is invalid");
            return false;
        }

    } catch (err) {
        return false;
    }
}

function isTokenValid() {

        // TODO : Extend Validity Checks with Server Side validation / JWKS

        console.log("Checking if Token is Valid");
        return !(tokenData.exp < new Date().getTime() / 1000);    

}

function getUserRecord() {    

    var sub = sessionStorage.getItem("userKey");
    
    if (sub === null) {
        sub = JSON.parse(getToken()).sub;
    }
    
    var request = new XMLHttpRequest();

    console.log("Preparing to call API");
    console.log("Sub: " + sub);
    request.open('GET', 'https://2y3ps0tqaj.execute-api.eu-west-1.amazonaws.com/poc/users?sub=' + sub, true);
    console.log("Authorization: " + sessionStorage.getItem("encodedtoken"));
    request.setRequestHeader("Authorization", sessionStorage.getItem("encodedtoken"));
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader("Access-Control-Allow-Origin", "https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com");
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
            sessionStorage.setItem("user", JSON.stringify(data));
            window.location.replace("index.html");
        }

    }

    request.send();

}