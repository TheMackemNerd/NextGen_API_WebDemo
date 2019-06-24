

function isSecure() {
    if (!secureCheck()) {
        console.log("Failed Secure Check");
        sessionStorage.setItem("lastPage", window.location.pathname + window.location.search);
        window.location.replace("https://hcm-hub-rnd.auth.eu-west-1.amazoncognito.com/login?response_type=token&client_id=57vo0lcv2gq0822td26v9nhnh6&redirect_uri=https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com/callback.html");
        return false;
    }

}

function logOut() {

    console.log("Clearing the Cookies");
    document.cookie = "accesstoken= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "sub= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";

}

function secureCheck() {

    if (isInSession()) {
        console.log("We are in a Session");
        return true;
    }
    else {

        console.log("We're not in a Session. Check to see if there is a Token in the URL")
        var token = getToken();
        
        if (token === undefined) {
            console.log("There's no token in the URL");
            return false;
        }
        else {
            console.log("There is a token in the URL. Decode it to check if it is valid.");
            var JWT = decodeToken(token);
            if (JWT != null) {

                console.log("Token is a valid JWT");

                if (isTokenValid(JWT)) {
                    console.log("Token has not expired");
                    createSession(token, JWT.sub);
                    return true;
                }
                else {
                    console.log("Token has expired");
                    return false;
                }

            }
            else {
                console.log("Token is not a valid JWT");
                return false;
            }
        }
    }
}

function isInSession() {

    console.log("Checking Session State");
    return (getCookie('accesstoken') != null);

}

function createSession(token, sub) {

    console.log("Creating Session");
    document.cookie = "accesstoken=" + encodeURIComponent(token);
    document.cookie = "sub=" + encodeURIComponent(sub);

}

function getToken() {

    console.log("Getting Token from URL");
    var fragments = jQuery.deparam.fragment();
    console.log(fragments);
    return fragments.access_token;

}

function decodeToken(token) {
    try {

        console.log("Decoding Token");
        console.log("Token: " + token);
        const base64HeaderUrl = token.split('.')[0];
        const base64Header = base64HeaderUrl.replace('-', '+').replace('_', '/');
        const headerData = JSON.parse(window.atob(base64Header));

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace('-', '+').replace('_', '/');
        var tokenData = JSON.parse(window.atob(base64));
        tokenData.header = headerData;

        return tokenData;

    } catch (err) {
        console.log("Token Parsing failed: " + err);
        return null;
    }

}

function isTokenValid(tokenData) {

    console.log("Checking if Token is Valid");
    var currentTime = new Date().getTime() / 1000
    console.log("Token Expiry: " + tokenData.exp + ", Current Time: " + currentTime + ", Difference: " + (tokenData.exp - currentTime));
    return !(tokenData.exp < currentTime);    

}

function userCheck(callback) {
    try {

        console.log("In the callback handler of getUserRecord");
        
        getUserRecord(function (error, response) {
            if (error) {
                console.log("Function returned an error");
                callback(error);
            }
            else {
                console.log("Function returned a success");
                callback(null, response);
            }

        });
    }
    catch (err) {
        console.log("An error occured: " + err);
        callback(err);
    }
}

function getUserRecord(callback) {    

    var sub = getCookie("sub");
    var token = getCookie("accesstoken");

    console.log("Sub: " + sub);
    console.log("Access Token: " + token);

    if (sub == null) {
        throw ("Sub Cookie is missing");
    }

    if (token == null) {
        throw ("Token Cookie is missing");
    }

    var request = new XMLHttpRequest();

    console.log("Preparing to call API");
    console.log("Sub: " + sub);
    request.open('GET', 'https://2y3ps0tqaj.execute-api.eu-west-1.amazonaws.com/poc/users?sub=' + sub, true);
    request.setRequestHeader("Authorization", token);
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader("Access-Control-Allow-Origin", "https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com");
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
            document.cookie = "user=" +  encodeURIComponent(data);
            callback(null,true)
        }

    }

    request.send();

}

function getCookie(name) {

    var cookies = document.cookie;
    var keys = cookies.split(';');
    var arrayLength = keys.length;
    for (var i = 0; i < arrayLength; i++) {
        var val = keys[i].split('=');
        console.log(i + ": Comparing: " + val[0] + " with " + name);
        if (val[0].trim() == name.trim()) {
            console.log(i + ": Match!");
            return decodeURIComponent(val[1]);
        }
        console.log(i + ": No Match");
    }
    return null;
}

function listCookies() {

    console.log("Listing Cookies...");
    var cookies = document.cookie;
    var keys = cookies.split(';');
    var arrayLength = keys.length;
    for (var i = 0; i < arrayLength; i++) {
        var val = keys[i].split('=');
        console.log("Cookie: " + i + ", Name: " + val[0] + ", Value: " + val[1]);
    }
    return true;
}