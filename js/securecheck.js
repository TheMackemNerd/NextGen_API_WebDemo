/*
 * File contains all functions related to Authentication & Authorisation
 */

const clientId = "57vo0lcv2gq0822td26v9nhnh6";
const apiKey = "A1HHVth5O34G649izzSy46z5Haja5pZ39SV1A2j7";
const redirectUri = "https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com/callback.html";
const logoutUri = "https://ec2-34-241-195-116.eu-west-1.compute.amazonaws.com/loggedout.html";
const identityProvider = "https://hcm-hub-rnd.auth.eu-west-1.amazoncognito.com";
const apiGateway = "https://2y3ps0tqaj.execute-api.eu-west-1.amazonaws.com/poc";

/*
 * FUNCTIONS RELATED TO THE GENERAL LOG-IN CHECK (Takes place in the Head of every page)
 * ===================================================================================
 */

// isSecure is the core function which performs log-in check
async function isSecure() {
    try {

        // Check to see if there's an Access Token in local storage
        if (!isInSession()) {

            // ACCESS TOKEN DOES NOT EXIST

            console.log("Failed Login Check, redirecting to Identity Provider");

            // Record the page the user is visiting (for later redirect)
            sessionStorage.setItem("lastPage", window.location.pathname + window.location.search);

            // Create an opaque State string and store it for later comparison
            var state = generateOpaqueString(30);
            sessionStorage.setItem("state", state);

            // Generate an opaque random string and a PKCE Challenge code
            var validator = generateOpaqueString(50);
            sessionStorage.setItem("validator", validator);
            var challenge = await createPKCEChallenge(validator);

            // Redirect the user to the /authorize endpoint of the Identity Provider
            window.location.replace(identityProvider + "/oauth2/authorize?response_type=code&client_id=" + clientId + "&redirect_uri=" + redirectUri + "&state=" + encodeURIComponent(state) + "&code_challenge_method=S256&code_challenge=" + encodeURIComponent(challenge));
            return false;
            
        }
        else {

            // ACCESS TOKEN DOES EXIST

            console.log("Session Exists. Checking if the Access Token has expired");

            // Decode the Access Token into a JWT object and check the Expiry date-time
            var expiry = decodeToken(getLocalVariable("accesstoken")).exp;
            console.log("Expiry: " + expiry);

            var currentTime = new Date().getTime() / 1000;
            console.log("Current Time: " + currentTime);

            // If the Expiry has passed, then the Access Token is no longer valid
            if (expiry < currentTime) {

                // ACCESS TOKEN HAS EXPIRED

                console.log("Access Token has Expired. Refreshing...");

                // Call the /token endpoint of the Identity Provider with the Refresh Token
                refreshTokens(function (error, result) {
                    if (error) {
                        console.log("Something went wrong refreshing the Access Token");
                        throw error;
                    }
                    else {
                        console.log("Restoring Access Token with new version");

                        // Swap the Access Token from the payload with the expired token in Local Storage
                        localStorage.setItem("accesstoken", JSON.parse(result).access_token);
                    }
                });
            }
        }
    }
    catch (e) {
        console.log("Error in Secure Check check: " + e);
        window.location.replace("error.html?errodesc=" + encodeURIComponent(e));
    }

}

// Check to see if an Access Token exists in Local Storage
function isInSession() {

    try {
        console.log("Checking Session State");
        console.log("Number of items in Local Storage: " + localStorage.length);
        console.log("Number of items in Session Storage: " + sessionStorage.length);
        return (getLocalVariable("accesstoken") != null);
    }
    catch (e) {
        console.log("Is in Session Failed: " + e);
        throw e;
    }

}

// Call the /token endpoint of the Identity Provider with the Refresh Token
function refreshTokens(callback) {

    try {

        var request = new XMLHttpRequest();
        request.open('POST', identityProvider + '/oauth2/token');
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        // Build a form body with the Refresh Token
        var refresh = getLocalVariable("refreshtoken");
        var details = {
            'grant_type': 'refresh_token',
            'client_id': clientId,
            'refresh_token': refresh
        };

        var formBody = [];
        for (var property in details) {
            var encodedKey = encodeURIComponent(property);
            var encodedValue = encodeURIComponent(details[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }
        formBody = formBody.join("&");

        // Call the endpoint and process the response
        request.onload = function () {
            if (request.status != 200) {
                console.log("The API returned an error");
                var err = JSON.parse(this.response).error;
                console.log(this.response);
                callback(err);
            }
            else {
                var data = this.response;
                console.log("API call Success: " + data);
                callback(null, data);
            }
        };

        request.send(formBody);
    }
    catch (e) {
        console.log("Refresh Tokens failed: " + e);
        callback(e);
    }

}

// Blank all local tokens and variables and then redirect the user to the directory Log Out endpoint
function logOut() {
    try {
        console.log("Clearing the Storage");
        localStorage.removeItem("accesstoken");
        localStorage.removeItem("sub");
        localStorage.removeItem("user");
        console.log("Redirecting to Logout");
        window.location.replace(identityProvider + "/logout?client_id=" + clientId + "&logout_uri=" + logoutUri);
    }
    catch (e) {
        console.log("Error in Log Out check: " + e);
        window.location.replace("error.html?errodesc=" + encodeURIComponent(e));
    }

}

/*
 * PKCE CHALLENGE RELATED FUNCTIONS 
 */

// Used to generate random alphanumeric strings of varying lengths for State and PKCE challenges
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

// Cryptographically encode a string with SHA256; eused as part of PKCE challenge
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

// Convert a string into base64. Used as part of PKCE challenge
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

// Generate a SHA256 encoded Challenge string for a given validator string as part of PKCE flow
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

/*
 * CALLBACK FUNCTIONS RELATED TO HANDLING THE RESPONSE FROM THE IDENTITY PROVIDER
 * ===================================================================================
 */

// AuthCodeCheck is used during the Authorization callback sequence to swap an Auth Code for Tokens
function AuthCodeCheck(callback) {
    try {

        // The Identity Provider will issues a code and it will echo back the State we sent in the /authorize
        console.log("Check to see if there is a code in the URL");
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

        // Check to ensure that the State matches the one we sent to the endpoint
        if (state != sessionStorage.getItem("state")) {
            console.log("The state response does not match");
            callback("The state response does not match", false);
        }

        else {

            // Exchange the code for tokens by calling the /token endpoint of the Identity Provider
            // exchangeCodeForToken requires callback
            exchangeCodeForToken(code, function (error, result) {
                if (error) {
                    callback("Couldn't exchange code for token", false);
                    return false;
                }
                else {
                    // Extract the Access & Refresh tokens from the payload
                    var localtoken = JSON.parse(result).access_token;
                    var refreshtoken = JSON.parse(result).refresh_token;
                    console.log("There is a token in the response: " + localtoken);

                    // Convert the string into a JWT object
                    var JWT = decodeToken(localtoken);

                    if (JWT != null) {

                        // Call the User API to check that the user exists in the application DB
                        console.log("Getting the User Record");
                        getUserRecord(localtoken, JWT.sub, function (error, response) {
                            if (error) {
                                console.log("Function returned an error");
                                callback(error, false);
                            }
                            else {
                                // Everything is OK; store the values
                                console.log("Function returned a success. Create a Session");
                                createSession(localtoken, JWT.sub, refreshtoken, response);
                                callback(null, true);
                            }
                        });

                    }
                    else {
                        console.log("Token is not a valid JWT");
                        callback("Token is not a valid JWT", false);
                    }

                }

            });
        }
    }
    catch (e) {
        console.log("Token Check failed: " + e);
        callback(e);
    }
}

// Add the Logged In data in Local Storage to be used later
function createSession(token, sub, refresh, user) {

    try {
        console.log("Creating Session");
        localStorage.setItem("accesstoken", token);
        localStorage.setItem("sub", sub);
        localStorage.setItem("refreshtoken", refresh);
        localStorage.setItem("user", user);

    }
    catch (e) {
        console.log("Create Session failed: " + e);
        throw e;
    }
}

// Take a token string and turn it into a queryable JWT object
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

// Call the /token endpoint of the Identity Provider to retrieve tokens
function exchangeCodeForToken(code, callback) {

    try {

        var request = new XMLHttpRequest();
        request.open('POST', identityProvider + '/oauth2/token');
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        // Create a form body with the Auth Code and the PKCE Validator we saved earlier
        var details = {
            'grant_type': 'authorization_code',
            'client_id': clientId,
            'redirect_uri': redirectUri,
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

        // Call the endpoint and process the response
        request.onload = function () {
            if (request.status != 200) {
                console.log("The API returned an error");
                var err = JSON.parse(this.response).error;
                console.log(this.response);
                callback(err);
            }
            else {
                var data = this.response;
                console.log("API call Success: " + JSON.stringify(data));
                callback(null, data);
            }
        };

        request.send(formBody);
    }
    catch (e) {
        console.log("Exchange Code for Token failed: " + e);
        callback(e);
    }
}

// Call an API to check at the user exists in the Application Database
function getUserRecord(token, sub, callback) {    

    try {

        var request = new XMLHttpRequest();
        console.log("Preparing to call API");
        //request.open('GET', apiGateway + '/users?sub=' + sub, true);
        request.open('GET', apiGateway + '/users/me', true);
        request.setRequestHeader("Authorization", token);
        request.setRequestHeader("x-api-key", apiKey);
        request.onload = function () {

            if (request.status != 200) {
                console.log("The API returned an error");
                var err = JSON.parse(this.response).message;
                console.log(err);
                callback(err);
            }
            else {
                console.log("API call Success");
                var data = this.response;
                callback(null, data);
            };

        };

        request.send();
    }
    catch (e) {
        console.log("Get User Record failed: " + e);
        callback(e);
    }

}

function getLocalVariable(name) {
    return localStorage.getItem(name);
}

function getCookie(name) {
    // DEPRECATED
    return getLocalVariable(name);

}

