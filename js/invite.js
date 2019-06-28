function doInvite() {

    /* DO INVITE FUNCTION
     * Used to handle new user details from a form and call the API
     */
   
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
            window.location.replace("error.html?errordesc=" + encodeURI("Cannot determine your Tenant ID"));
        }

        // Retrieve the user values from the form
        console.log("Getting URL Parameters");
        var urlParams = new URLSearchParams(window.location.search);
        var emailaddress = urlParams.get('emailaddress');
        var fullname = urlParams.get('fullname');
        var phone = urlParams.get('phone');

        console.log(data);
        var data = {
            emailaddress: emailaddress,
            fullname: fullname,
            tenant: tenant,
            phone: phone
        };

        // Call the API
        console.log("Creating API Call");
        var request = new XMLHttpRequest();
        request.open('POST', 'https://2y3ps0tqaj.execute-api.eu-west-1.amazonaws.com/poc/users');
        request.setRequestHeader("Authorization", token);
        request.setRequestHeader("Content-Type", "application/json");

        request.onload = function () {

            console.log("Performing API Callback");

            if (request.status == 200 || request.status == 201) {
                console.log("API call Success: " + request.data);

            }
            else {
                console.log("The API returned an error");
                var err = this.response;
                console.log(err);
                window.location.replace("error.html?errordesc=" + encodeURI(err));
            }

        }

        console.log("Calling API");
        request.send(JSON.stringify(data));

    }
    catch (e) {
        throw e;
    }



}