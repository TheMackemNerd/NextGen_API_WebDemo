var tokenData = "";

function isSecure() {
    if (!secureCheck()) {
        window.location.replace("https://hcm-hub-rnd.auth.eu-west-1.amazoncognito.com/login?response_type=token&client_id=57vo0lcv2gq0822td26v9nhnh6&redirect_uri=http://localhost:3000/callback");
    }
    else {
        document.getElementById("dvToken").innerHTML = JSON.stringify(tokenData);
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
    const urlParams = new URLSearchParams(window.location.search);
    var token = urlParams.get('id_token');

    return token;

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
