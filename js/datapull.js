
/* DATA PULL FUNCTION
 * Used to display business data retrieved from an API
 */

function doDataPull() {
    try {

        // Access Token is required to call the API
        console.log("Retrieving Access Token");
        var token = getLocalVariable("accesstoken");

        // The User record is needed to determine which tenant the current user belongs to.
        // NOTE: we could also do this in the back-end as a secondary check
        console.log("Retrieving User");
        if (getLocalVariable("user") != null) {
            console.log("User Cookie retrieved");
            var tenant = JSON.parse(getLocalVariable("user")).tenant;
        }
        else {
            console.log("No user cookie can be found so we cannot get the tenancy");
            throw ("Cannot determine your Tenant ID");
        }

        // Retrieve the Tenant values from the form; this is the tenant of the data we're trying to access
        console.log("Getting URL Parameters");
        var urlParams = new URLSearchParams(window.location.search);
        var queryTenant = urlParams.get('tenant');

        // Put a warning on the screen that the tenants don't match
        if (tenant == queryTenant) {
            document.getElementById("clientSideCheck").innerHTML = "Client side check determined that the tenant being queried is the same as the user.";
        }
        else {
            document.getElementById("clientSideCheck").innerHTML = "You should never see this message. Tenant of the user doesn't match the query; the back-end API should block this call.";
        }

        // Call the API
        var request = new XMLHttpRequest();
        console.log("Query Tenant: " + queryTenant);
        request.open('GET', 'https://2y3ps0tqaj.execute-api.eu-west-1.amazonaws.com/poc/tenants?id=' + queryTenant, true);
        request.setRequestHeader("Authorization", token);
        request.setRequestHeader("x-api-key", apiKey);
        request.setRequestHeader("Content-Type", "text/plain");
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
                document.getElementById("responseText").innerHTML = JSON.parse(data).description;

            }

        }

        request.send();
    }
    catch (e) {
        throw e;
    }


}