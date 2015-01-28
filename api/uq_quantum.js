XMLHttpRequest 	= require("xhr2").XMLHttpRequest;

var equipment_timeout = 10000; // 10 seconds
function hostname() {
    return "http://www.example.com:1000/";
}

function motor(number, value, callback) {
    var url = hostname() + "?action=set&param=pm" + number + "&value=" + value;
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
            var expected = "<html><body>Set Motor "+number+" Position to "+value+"</body></html>";
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

function motor_action(number, options, validate, callback) {

    //Extract input parameters
    var input = parseFloat(options);

    //Validation
    if (!(input >= -180 && input <= 180)) {
        callback({success:false, info:"You can only enter an input value between -180 and 180 (" + options + ")"}, undefined);
        return;
    }

    //Are we only validating this function?
    if (validate) {
        callback({success:true, time: 1}); //TODO: Better time estimate
        return;
    }

    //Execute the action
    motor(number, input, function(success) {
        callback({success:true});
    });
}

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

            /*
             <html><body>
             Number of Measurements: 50458<br>
             Integration Time (ms): 1000<br>
             0: 1226<br>
             1: 5375<br>
             2: 1583<br>
             3: 0<br>
             01: 0<br>
             02: 0<br>
             03: 0<br>
             12: 0<br>
             13: 0<br>
             23: 0<br>
             012: 0<br>
             013: 0<br>
             023: 0<br>
             123: 0<br>
             </body></html>
             */

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
                defines.prettyConsole("Invalid response: " + xhr.responseText + "\n" +
                    "occurred at: " + url + "\n" +
                    "with error: " + err + "\n");
                return callback(false);
            }
        }
    }
    xhr.send();
}

exports.actions = {
    motor1: function(options, validate, callback) {
        motor_action(1, options, validate, callback);
    },
    motor2: function(options, validate, callback) {
        motor_action(2, options, validate, callback);
    },
    motor3: function(options, validate, callback) {
        motor_action(3, options, validate, callback);
    },
    counts: function(options, validate, callback) {
        //Are we only validating this function?
        if (validate) {
            callback({success:true, time: 1}); //TODO: Better time estimate
            return;
        }

        //Execute the action
        get_counts(function(success, output) {
            callback({success:true}, output);
        });
    }
};