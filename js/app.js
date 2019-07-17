var userData;
var eventRef;

/**
 * When the the page is loaded, start the barcode reader.
 */
window.addEventListener("DOMContentLoaded", function() {
    // Add a click listener to the create event button to its corresponding function
    document.getElementById("createEvent").addEventListener("click", createEvent);

    /**
     * Check if the user has previously logged in.
     */
    firebase.auth().onAuthStateChanged(function (user) {
        // If the user has logged in
        if (user) {
            // Save the user data
            userData = user;

            // Display logout as the user action
            document.getElementById("userAction").addEventListener('click', logout);
            document.getElementById("userAction").innerHTML = "Logout";

            document.getElementById("createEvent").style.display = "";
        }
        // If the user is not logged in
        else {
            // Display login as the user action
            document.getElementById("userAction").addEventListener('click', login);
            document.getElementById("userAction").innerHTML = "Login";
        }
    });
});

/**
 * Start the barcode scanning camera.
 */
function launchBarcodeCamera() {
    /**
     * Get all the video devices that the web browswer can access.
     */
    Quagga.CameraAccess.enumerateVideoDevices().then(function (devices) {
        var deviceId;

        // If there is a back camera use it, otherwise just use whatever camera there is
        devices.forEach(function (device) {
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
 * Create an event, which is how barcodes are separated and stored within the databse.
 */
function createEvent() {
    // Launch the barcode scanning camera
    launchBarcodeCamera();

    if (userData) {
        var eventName = prompt("What is the name of your event?");

        // Connect to the database at a reference point for the user
        eventRef = firebase.database().ref("users/" + user.uid).push();
        eventRef.set({
            'eventName': eventName
        });
    }
}

/**
 * Whenever the barcode reader detects a barcode, store it.
 */
Quagga.onDetected(function (result) {
    // Get the detected barcode
    var code = result.codeResult.code;

    var codesRef = firebase.database().ref("users/" + userData.uid + "/" + eventRef.key() + "/codes");
    codesRef.push({'code': code, 'time': new Date().getTime()}, function(err) {
        if (err) {
            console.error(err);
        }
        else {
            // Show a success alert with the code that was scanned
            $(".container-fluid").prepend('<div class="alert alert-success" role="alert">Scanned: ' + code + '</div>');

            // Make the alert dismiss after one and a half seconds
            setTimeout(function () {
                $(".alert").alert('close');
            }, 1500);
        }
    });
});

/**
 * Sign into Google.
 */
function login() {
    // Set auth to be persistent and need logout to clear user login 
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    // Sign in with Google Auth Provider
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
}

/**
 * Logout from Google.
 */
function logout() {
    firebase.auth().signOut().then(function() {
        console.log("Sign out successful.");
    }).catch(function(error) {
        console.error(error.code + ": " + error.message);
    });
}

/**
 * A helper function to replace all instances of a substring in a string.
 */
String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};