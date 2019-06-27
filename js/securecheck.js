

function isSecure() {
    if (!isInSession()) {
        console.log("Failed Login Check");
        sessionStorage.setItem("lastPage", window.location.pathname + window.location.search);
        window.location.replace("https://hcm-hub-rnd.auth.eu-west-1.amazoncognito.com/oauth2/authorize?response_type=code&client_id=57vo0lcv2gq0822td26v9nhnh6&redirect_uri=https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com/callback.html");
        return false;
    }

}

function isInSession() {

    console.log("Checking Session State");
    console.log("Number of items in Local Storage: " + localStorage.length);
    console.log("Number of items in Session Storage: " + sessionStorage.length);
    return (getCookie("accesstoken") != null);

}

function logOut() {

    console.log("Clearing the Storage");
    localStorage.removeItem("accesstoken");
    localStorage.removeItem("sub");
    localStorage.removeItem("user");

    //document.cookie = "accesstoken= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    //document.cookie = "sub= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    //document.cookie = "user= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";

}

function tokenCheck() {

    if (isInSession()) {
        console.log("We are in a Session");
        return true;
    }
    else {

        console.log("We're not in a Session. Check to see if there is a code in the URL")
        var urlParams = new URLSearchParams(window.location.search);
        var code = urlParams.get("code");


        if (code === undefined) {
            console.log("There's no authorization code in the URL");
            return false;
        }
        else {

            exchangeCodeForToken(code, function (error, result) {
                if (error) {
                    // do something
                    return false;
                }
                else {

                    var localtoken = JSON.parse(result).access_token;
                    console.log("There is a token in the response: " + localtoken);
                    var JWT = decodeToken(localtoken);

                    if (JWT != null) {

                        console.log("Token is a valid JWT");

                        if (isTokenValid(JWT)) {
                            console.log("Token has not expired");
                            createSession(localtoken, JWT.sub);

                           
                            console.log("Getting the User Record");
                            getUserRecord(localtoken, JWT.sub, function (error, response) {
                                if (error) {
                                    console.log("Function returned an error");
                                    return false;
                                }
                                else {
                                    console.log("Function returned a success");
                                    return true;
                                }

                            });
                            
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

            })
        }
    }
}


function createSession(token, sub) {

    console.log("Creating Session");
    localStorage.setItem("accesstoken", token);
    localStorage.setItem("sub", sub);

    console.log("Reading it back (Access Token): " + localStorage.getItem("accesstoken"));
    console.log("Reading it back (Sub): " + localStorage.getItem("accesstoken"));

    //document.cookie = "accesstoken=" + encodeURIComponent(token);
    //document.cookie = "sub=" + encodeURIComponent(sub);    

}

function getToken(tokenType) {

    console.log("Getting Token from URL");
    var fragments = jQuery.deparam.fragment();
    console.log(fragments);
    if (tokenType == 1) {
        return fragments.access_token;
    }
    else {
        return fragments.id_token;
    }

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

    } catch (error) {
        console.log("Token Parsing failed: " + error);
        return null;
    }

}

function isTokenValid(tokenData) {

    console.log("Checking if Token is Valid");
    var currentTime = new Date().getTime() / 1000
    console.log("Token Expiry: " + tokenData.exp + ", Current Time: " + currentTime + ", Difference: " + (tokenData.exp - currentTime));
    return !(tokenData.exp < currentTime);    

}

function exchangeCodeForToken(code, callback) {

    var request = new XMLHttpRequest();

    request.open('POST', 'https://hcm-hub-rnd.auth.eu-west-1.amazoncognito.com/oauth2/token');    
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");


    var details = {
        'grant_type': 'authorization_code',
        'client_id': '57vo0lcv2gq0822td26v9nhnh6',
        'redirect_uri': 'https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com/callback.html',
        code: code
    };

    var formBody = [];
    for (var property in details) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(details[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
        
    request.onload = function () {
        if (request.status != 200) {
            console.log("The API returned an error");
            var err = JSON.parse(this.response).error;
            console.log(this.response);
            callback(err)
        }
        else {            
            var data = this.response;
            console.log("API call Success: " + JSON.stringify(data));
            callback(null, data)
        }
    }

    request.send(formBody);
}

function getUserRecord(token, sub, callback) {    

    var request = new XMLHttpRequest();

    console.log("Preparing to call API");
    console.log("Sub: " + sub);
    request.open('GET', 'https://2y3ps0tqaj.execute-api.eu-west-1.amazonaws.com/poc/users?sub=' + sub, true);
    request.setRequestHeader("Authorization", token);
    request.setRequestHeader("Content-Type", "application/json");
    request.setRequestHeader("Origin", "https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com");
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
            localStorage.setItem("user", encodeURIComponent(data));
            //document.cookie = "user=" +  encodeURIComponent(data);
            callback(null,true)
        }

    }

    request.send();

}

function getCookie(name) {

    return localStorage.getItem(name);

    /*
    var cookies = document.cookie;
    var keys = cookies.split(';');
    var arrayLength = keys.length;
    for (var i = 0; i < arrayLength; i++) {
        var val = keys[i].split('=');
        //console.log(i + ": Comparing: " + val[0] + " with " + name);
        if (val[0].trim() == name.trim()) {
            console.log(i + ": Match!");
            return decodeURIComponent(val[1]);
        }
        //console.log(i + ": No Match");
    }
    return null;
    */
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