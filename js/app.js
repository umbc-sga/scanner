// Script globals
var spreadsheetID = "";
var isLoggedIn = false;
var scannedCodes = [];

// Client ID and API key from the Developer Console
var CLIENT_ID = '472938835007-rrt6ml2b8ddt23s8aa1ntop144l2nbu8.apps.googleusercontent.com';
var API_KEY = 'AIzaSyDf-X1sVw3JHo81BHNzYEE8nb7Slk0jmnU';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets";

// Signin/signout buttons
var loginButton = document.getElementById('login_button');
var signoutButton = document.getElementById('signout_button');

/**
*  On load, called to load the auth2 library and API client library.
*/
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
*  Initializes the API client library and sets up sign-in state
*  listeners.
*/
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    })
    .then(function() {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        loginButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    }, 
    function(error) {
        console.log(JSON.stringify(error, null, 2));
    });
}

/**
*  Called when the signed in status changes, to update the UI
*  appropriately. After a sign-in, the API is called.
*/
function updateSigninStatus(isSignedIn) {
    isLoggedIn = isSignedIn;

    if (isSignedIn) {
        loginButton.style.display = 'none';
        signoutButton.style.display = 'block';
    } 
    else {
        loginButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

/**
*  Sign in the user upon button click.
*/
function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

/**
*  Sign out the user upon button click.
*/
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

/**
* Start the barcode scanning camera.
*/
function launchBarcodeCamera() {
    /**
    * Get all the video devices that the web browser can access.
    */
    Quagga.CameraAccess.enumerateVideoDevices().then(function(devices) {
        var deviceId;

        // If there is a back camera use it, otherwise just use whatever camera there is
        devices.forEach(function(device) {
            // If it is the back camera, automatically use that
            if (device.label == "Back Camera") {
                deviceId = device.deviceId;

                return;
            }
            else
                deviceId = deviceId;
        });

        // Initialize the barcode reader
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                constraints: { 'deviceId': deviceId }
            },
            decoder: { readers: ["codabar_reader"] }
        },
        function (err) {
            // Log errors if there are any
            if (err) console.error(err);

            // Start the barcode reader
            Quagga.start();

            // Show the camera view
            document.getElementById("interactive").style.display = "";
        });
    });
}

/**
*  Launch the barcode scanning camera and create the event Google Sheet.
*/
function startScanning() {
    // Launch the barcode scanning camera 
    launchBarcodeCamera();

    // Create file name which is today's date + "Scanned IDs"
    var today = new Date();
    var fileName = (today.getMonth() + 1) + "/" + today.getDate() + "/" + today.getFullYear() + " Scanned IDs";

    // Create the spreadsheet with the Sheets API
    gapi.client.sheets.spreadsheets.create({
        properties: {
            title: fileName
        }
    })
    .then(function(response) {
        // Get spreadsheet ID
        spreadsheetID = response.result.spreadsheetId;
    });
}


/**
*  Listen for whenever a new code is detected.
*/
Quagga.onDetected(function(result) {
    // Get the detected barcode
    var code = result.codeResult.code;

    // If this code has already been scanned or is not valid, do not proceed
    if (scannedCodes.includes(code) || code.substring(0, 1) != "A" 
        || code.substring(code.length - 1) != "A" || code.length != 16) return;

    // Add code to scannedCodes array to keep track of it
    scannedCodes.push(code);

    // Create row in same format as what the physical scanner outputs
    var body =  { values: [ [getDate(), getTime(), "02", code] ] };

    // Append the row to the spreadsheet
    gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetID,
        range: "Sheet1!A:A",
        valueInputOption: "RAW",
        resource: body
    })
    .then(function(response) {
        var result = response.result;

        // Log any errors
        if (result.error) 
            console.err(result.error.message);
        else {
            // Show a success alert with the code that was scanned
            $(".container-fluid").prepend('<div class="alert alert-success" role="alert">Scanned: ' + code + '</div>');

            // Make the alert dismiss after one and a half seconds
            setTimeout(function () {
                $(".alert").alert('close');
            }, 3000);
        }
    });
});

/**
*  Get the date in the proper format.
*/
function getDate() {
    var today = new Date();
 
    // Get date information
    var month = today.getMonth() + 1;
    var day = today.getDate();
    var year = today.getFullYear().toString().substring(2, 4);
 
    // Add padding to month
    if (month < 10) month = "0" + month;
 
    // Add padding to day
    if (day < 10) day = "0" + day;

    return month + "/" + day + "/" + year;
}


/**
*  Get the time in the proper format.
*/
function getTime() {
    var today = new Date();

    // Get time information
    var hour = today.getHours();
    var mins = today.getMinutes();
    var secs = today.getSeconds();

    // Add padding to hour
    if (hour < 10) hour = "0" + hour;
 
    // Add padding to minutes
    if (mins < 10) mins = "0" + mins;
    else if (mins === 0) mins = "00";
 
    // Add padding to seconds
    if (secs < 10) secs = "0" + secs;
    else if (secs === 0) secs = "00";

    return hour + ":" + mins + ":" + secs;
}