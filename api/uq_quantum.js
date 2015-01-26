XMLHttpRequest 	= require("xhr2").XMLHttpRequest;

var equipment_timeout = 10000;
function hostname() {
    return "http://www.example.com:1000/";
}

/**
 * Tells the equipment to move a motor.
 * @param number - motor number
 * @param value - motor position
 * @param callback - function(success)
 */
function motor(number, value, callback) {
    var url = hostname() + "?action=set&param=pm" +
        number + "&value=" + value;

    var xhr = new XMLHttpRequest();
    xhr.timeout = equipment_timeout;
    xhr.open('get', url, true);

    if (typeof callback !== 'undefined') {
        xhr.onerror = function (e) {
            defines.prettyConsole("Motor error: " + xhr.statusText + "\n" +
                "occurred at: " + url + "\n");
            return callback(false);
        };

        xhr.onload = function () {

            // Verify the response text is what we expect
            var expected = "<html><body>Set Motor " + number +
                " Position to "+value+"</body></html>";
            if (xhr.responseText == expected) {
                return callback(true);
            }

            defines.prettyConsole("Invalid response: " + xhr.responseText + "\n" +
                "occurred at: " + url + "\n");
            return callback(false);
        }
    }
    xhr.send();
}

/**
 * A generic action to control motors
 * @param number - motor number
 * @param options - desired position
 * @param validate - whether this is only a validation
 * @param callback - function(success)
 */
function motor_action(number, options, validate, callback) {

    //Extract input parameters
    var input = parseFloat(options);

    //Validation
    if (!(input >= -180 && input <= 180)) {
        callback({success:false,
            info:"You can only enter an input value between -180 and 180 (" +
                options + ")"}, undefined);
        return;
    }

    //Are we only validating this function?
    if (validate) {
        callback({success:true, time: 0.1}); //TODO: Better time estimate
        return;
    }

    //Execute the action
    motor(number, input, function(success) {
        callback({success:true});
    });
}

/**
 * Returns the current counts
 * @param callback - function(success, output)
 */
function get_counts(callback) {
    var url = hostname() + "?action=get&param=cnt";
    var xhr = new XMLHttpRequest();
    xhr.timeout = equipment_timeout;
    xhr.open('get', url, true);

    if (typeof callback !== 'undefined') {
        xhr.onerror = function (e) {
            defines.prettyConsole("Counts error: " + xhr.statusText + "\n" +
                "occurred at: " + url + "\n");
            return callback(false);
        };

        xhr.onload = function () {

            // Parse the response text
            try {
                var split = xhr.responseText.match(RegExp("<html><body>(.*)</body></html>"))[1].split("<br>");
                var output = {};
                for (var i = 0; i < split.length-1; i += 2) {
                    var params = split[i].split(":");
                    output[params[0]] = parseInt(params[1]);
                }
                return callback(true, output);
            } catch (err) {
                defines.prettyConsole("Invalid response: " +
                    xhr.responseText + "\n" +
                    "occurred at: " + url + "\n" +
                    "with error: " + err + "\n");
                return callback(false);
            }
        }
    }
    xhr.send();
}

exports.actions = {

    /**
     * Moves motor 1
     * @param options - desired position
     * @param validate - whether this is only a validation
     * @param callback - function(success)
     */
    motor1: function(options, validate, callback) {
        motor_action(1, options, validate, callback);
    },

    /**
     * Moves motor 2
     * @param options - desired position
     * @param validate - whether this is only a validation
     * @param callback - function(success)
     */
    motor2: function(options, validate, callback) {
        motor_action(2, options, validate, callback);
    },

    /**
     * Moves motor 3
     * @param options - desired position
     * @param validate - whether this is only a validation
     * @param callback - function(success)
     */
    motor3: function(options, validate, callback) {
        motor_action(3, options, validate, callback);
    },

    /**
     * Returns the current counts
     * @param options - undefined
     * @param validate - whether this is only a validation
     * @param callback - function(success, outputs)
     */
    counts: function(options, validate, callback) {
        //Are we only validating this function?
        if (validate) {
            callback({success:true, time: 0.1}); //TODO: Better time estimate
            return;
        }

        //Execute the action
        get_counts(function(success, output) {
            callback({success:true}, output);
        });
    }
};