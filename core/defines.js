
/*
 * Copyright (c) 2014, Samuel Colbran <contact@samuco.net>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright notice, this
 * list of conditions and the following disclaimer in the documentation and/or
 * other materials provided with the distribution.

 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var defines = module.exports;

defines.enableVerbose = false;
defines.allowJSEngine = false;
defines.executionTime = 60000;

//------------------------------
//Do not modify below this line.

// Printing
colors = require("colors");
defines.loaded = colors.green("loaded");
defines.failed = colors.red("failed");

//States
defines.idle_status = 0;
defines.running_status = 1;
defines.starting_status = 2;
defines.finishing_status = 3;

//JS Engine
defines.strictExecution = true;
defines.strictEngine = false;
defines.memoryLimitMB = 50;
defines.sandboxes = 5;
defines.parallelValidation = defines.sandboxes-1; //defines.sandboxes-1
defines.validationTime = 1000;

//Lab mode
defines.batchMode = true;
defines.realTimeID = "test";

//Experiment status codes
defines.kInQueue = 1
defines.kRestricted = 7
defines.kRunning = 2
defines.kFinished = 3
defines.kFinishedWithErrors = 4
defines.kCancelled = 5
defines.kInvalidExperiment = 6

//Developer
defines._developer_mode = false;
defines.debug = function(message)
{
    if (defines._developer_mode)
        console.log(message);
}

//Pretty printing
defines.verbose = function(message)
{
    if (defines.enableVerbose)
        console.log(message);
};


defines.lineWidth = 40;
defines.prettyConsole = function(message) {
    if (!defines.enableVerbose)
        process.stdout.write(message);
};
defines.strlen = function(str) {
	var len = 0;
	for (var i = 0; i < str.length; i++) {
		var code = str.charCodeAt(i);
		if (code == 27) { // ESC
			i += 4;
			continue;
		}
		len++;
	}
	return len;
}
defines.prettyLine = function(start, end) {
    defines.prettyConsole(start);
    defines.printDots(defines.lineWidth-defines.strlen(start)-defines.strlen(end));
    defines.prettyConsole(end);
    defines.prettyConsole('\n');
};
defines.printSeparator = function()
{
    var d = 0;
    for (d = 0; d < defines.lineWidth; d++) {
        defines.prettyConsole("-");
    }
    defines.prettyConsole("\n");
}
defines.printDots = function(dotNum)
{
    var d = 0;
    for (d = 0; d < dotNum; d++) {
        defines.prettyConsole(".");
    }
};
defines.clearConsole = function() {
    if (typeof process.stdout.getWindowSize !== 'undefined') {
        var lines = process.stdout.getWindowSize()[1];
        for (var i = 0; i < lines; i++) {
            defines.prettyConsole('\r\n');
        }
    }
}


//Helper functions
defines.randomString = function (len, bits)
{
    bits = bits || 36;
    var outStr = "", newStr;
    while (outStr.length < len)
    {
        newStr = Math.random().toString(bits).slice(2);
        outStr += newStr.slice(0, Math.min(newStr.length, (len - outStr.length)));
    }
    return outStr.toUpperCase();
};

defines.timeStamp = function()
{
    // Create a date object with the current time
    var now = new Date();

    // Create an array with the current month, day and time
    var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];

    // Create an array with the current hour, minute and second
    var time = [ now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds()];

    // Determine AM or PM suffix based on the hour
    var suffix = ( time[0] < 12 ) ? "AM" : "PM";

    // Convert hour from military time
    time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;

    // If hour is 0, set it to 12
    time[0] = time[0] || 12;

    // If seconds and minutes are less than 10, add a zero
    for ( var i = 1; i < 3; i++ ) {
        if ( time[i] < 10 ) {
            time[i] = "0" + time[i];
        }
    }

    // Return the formatted string
    return date.join("/") + " " + time.join(":") + " " + suffix;
}

defines.asyncLoop = function(iterations, process, exit){
    var index = 0,
        done = false,
        shouldExit = false;
    var loop = {
        next:function(){
            if(done){
                if(shouldExit && exit){
                    return exit(); // Exit if we're done
                }
            }
            // If we're not finished
            if(index < iterations){
                index++; // Increment our index
                process(loop); // Run our process, pass in the loop
                // Otherwise we're done
            } else {
                done = true; // Make sure we say we're done
                if(exit) exit(); // Call the callback on exit
            }
        },
        iteration:function(){
            return index - 1; // Return the loop number we're on
        },
        break:function(end){
            done = true; // End the loop
            shouldExit = end; // Passing end as true means we still call the exit callback
        }
    };
    loop.next();
    return loop;
};