

async function isSecure() {
    try {


        if (!isInSession()) {

            console.log("Failed Login Check, redirecting to Identity Provider");
            return false;
            
            sessionStorage.setItem("lastPage", window.location.pathname + window.location.search);
    
            var state = generateOpaqueString(30);
            sessionStorage.setItem("state", state);
    
            var validator = generateOpaqueString(50);
            sessionStorage.setItem("validator", validator);
            var challenge = await createPKCEChallenge(validator);
    
            window.location.replace("https://hcm-hub-rnd.auth.eu-west-1.amazoncognito.com/oauth2/authorize?response_type=code&client_id=57vo0lcv2gq0822td26v9nhnh6&redirect_uri=https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com/callback.html&state=" + encodeURIComponent(state) + "&code_challenge_method=S256&code_challenge=" + encodeURIComponent(challenge));
            return false;
            
        }
        else {
            console.log("Session Exists. Checking if the Access Token has expired");

            var expiry = decodeToken(getCookie("accesstoken")).exp;
            console.log("Expiry: " + expiry);
            var currentTime = new Date().getTime() / 1000;
            console.log("Current Time: " + currentTime);
            if (expiry < currentTime) {

                console.log("Access Token has Expired. Refreshing...");
                refreshTokens(function (error, result) {
                    if (error) {
                        console.log("Something went wrong refreshing the Access Token");
                        // do something
                    }
                    else {
                        console.log("Restoring Access Token with new version")
                        localStorage.setItem("accesstoken", JSON.parse(result).access_token);
                    }
                })
            }
        }
    }
    catch (e) {
        console.log("Error in Secure Check check: " + e);
        window.location.replace("error.html?errodesc=" + encodeURIComponent(e));
    }

}

function isInSession() {

    try {
        console.log("Checking Session State");
        console.log("Number of items in Local Storage: " + localStorage.length);
        console.log("Number of items in Session Storage: " + sessionStorage.length);
        return (getCookie("accesstoken") != null);
    }
    catch (e) {
        console.log("Is in Session Failed: " + e);
        throw e;
    }

}

function logOut() {
    try {
        console.log("Clearing the Storage");
        localStorage.removeItem("accesstoken");
        localStorage.removeItem("sub");
        localStorage.removeItem("user");
        console.log("Redirecting to Logout");
        window.location.replace('https://hcm-hub-rnd.auth.eu-west-1.amazoncognito.com/logout?client_id=57vo0lcv2gq0822td26v9nhnh6&logout_uri=https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com/loggedout.html');
    }
    catch (e) {
        console.log("Error in Log Out check: " + e);
        window.location.replace("error.html?errodesc=" + encodeURIComponent(e));
        break;
    }

}

function generateOpaqueString(length) {
    try {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    catch (e) {
        console.log("Generate Opaque Token failed: " + e);
        throw e;
    }

}

function sha256(plain) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(plain);
        return window.crypto.subtle.digest('SHA-256', data);
    }
    catch (e) {
        console.log("SHA256 failed: " + e);
        throw e;
    }
}

function base64urlencode(str) {
    try {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    catch (e) {
        console.log("Base64 Encode failed: " + e);
        throw e;
    }
}

async function createPKCEChallenge(validator) {
    try {
        var hashed = await sha256(validator);
        return base64urlencode(hashed);
    }
    catch (e) {
        console.log("Create PKCE Challenge failed: " + e);
        throw e;
    }
}

function tokenCheck(callback) {
    try {

        if (isInSession()) {
            console.log("We are in a Session");
            callback(null, true);
        }
        else {

            console.log("We're not in a Session. Check to see if there is a code in the URL")
            var urlParams = new URLSearchParams(window.location.search);
            var code = urlParams.get("code");
            var state = urlParams.get("state");

            if (code === undefined) {
                console.log("There's no authorization code in the URL");
                callback("There's no authorization code in the URL", false);
            }

            if (state === undefined) {
                console.log("There's no state in the URL");
                callback("There's no state in the URL", false);
            }

            if (state != sessionStorage.getItem("state")) {
                console.log("The state response does not match");
                callback("The state response does not match", false);
            }

            else {

                exchangeCodeForToken(code, function (error, result) {
                    if (error) {
                        callback("Couldn't exchange code for token", false);
                    }
                    else {

                        var localtoken = JSON.parse(result).access_token;
                        var refreshtoken = JSON.parse(result).refresh_token;
                        console.log("There is a token in the response: " + localtoken);
                        var JWT = decodeToken(localtoken);

                        if (JWT != null) {

                            console.log("Token is a valid JWT");

                            if (isTokenValid(JWT)) {
                                console.log("Token has not expired");
                                createSession(localtoken, JWT.sub, refreshtoken);


                                console.log("Getting the User Record");
                                getUserRecord(localtoken, JWT.sub, function (error, response) {
                                    if (error) {
                                        console.log("Function returned an error");
                                        callback("Error getting user record", false);
                                    }
                                    else {
                                        console.log("Function returned a success");
                                        callback(null, true);
                                    }

                                });

                            }
                            else {
                                console.log("Token has expired");
                                callback("Token has expired", false);
                            }

                        }
                        else {
                            console.log("Token is not a valid JWT");
                            callback("Token is not a valid JWT", false);
                        }

                    }

                })
            }
        }
    }
    catch (e) {
        console.log("Token Check failed: " + e);
        callback(e);
    }
}


function createSession(token, sub, refresh) {

    try {
        console.log("Creating Session");
        localStorage.setItem("accesstoken", token);
        localStorage.setItem("sub", sub);
        localStorage.setItem("refreshtoken", refresh);
    }
    catch (e) {
        console.log("Create Session failed: " + e);
        throw e;
    }
}

function getToken(tokenType) {

    try {
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
    catch (e) {
        console.log("Get Token failed: " + e);
        throw e;
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

    } catch (e) {
        console.log("Token Parsing failed: " + e);
        throw e;
    }

}

function isTokenValid(tokenData) {
    try {
        console.log("Checking if Token is Valid");
        var currentTime = new Date().getTime() / 1000
        console.log("Token Expiry: " + tokenData.exp + ", Current Time: " + currentTime + ", Difference: " + (tokenData.exp - currentTime));
        return !(tokenData.exp < currentTime);   
    }
    catch (e) {
        console.log("Token Validity Check failed: " + e);
        throw e;
    }
 
}

function refreshTokens(callback) {

    try {
        var request = new XMLHttpRequest();

        request.open('POST', 'https://hcm-hub-rnd.auth.eu-west-1.amazoncognito.com/oauth2/token');
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        var refresh = getCookie("refreshtoken");

        var details = {
            'grant_type': 'refresh_token',
            'client_id': '57vo0lcv2gq0822td26v9nhnh6',
            'refresh_token': refresh
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
                console.log("API call Success: " + data);
                callback(null, data)
            }
        }

        request.send(formBody);
    }
    catch (e) {
        console.log("Refresh Tokens failed: " + e);
        callback(e);
        break;
    }
    
}


function exchangeCodeForToken(code, callback) {

    try {
        var request = new XMLHttpRequest();

        request.open('POST', 'https://hcm-hub-rnd.auth.eu-west-1.amazoncognito.com/oauth2/token');
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");


        var details = {
            'grant_type': 'authorization_code',
            'client_id': '57vo0lcv2gq0822td26v9nhnh6',
            'redirect_uri': 'https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com/callback.html',
            code: code,
            code_verifier: sessionStorage.getItem("validator")
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
    catch (e) {
        console.log("Exchange Code for Token failed: " + e);
        callback(e);
        break;
    }


}

function getUserRecord(token, sub, callback) {    

    try {
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
                localStorage.setItem("user", data);
                callback(null, true)
            }

        }

        request.send();
    }
    catch (e) {
        console.log("Get User Record failed: " + e);
        callback(e);
        break;
    }

}

function getCookie(name) {

    return localStorage.getItem(name);

}

