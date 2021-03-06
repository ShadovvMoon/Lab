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

var crypto = require('crypto');
var path = require('path');
var database = require('./database');
var queue = require('./queue');
var defines = require('./defines');
var fs = require('fs');
var parseString = require('xml2js').parseString;

// Validator
var js_validator = require('./js_validator');
var js_spec_module = module.exports;


/**
 *
 * @param str
 * @returns {XML|string|void|*}
 * @private
 */
function _escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

/**
 *
 * @param find
 * @param replace
 * @param str
 * @returns {XML|string|void|*}
 */
function replaceAll(find, replace, str) {
    return str.replace(new RegExp(_escapeRegExp(find), 'g'), replace);
}

/**
 *
 * @param n
 * @returns {boolean}
 */
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 *
 * @param str
 * @returns {*}
 * @private
 */
function _parseEscapedString(str) {
    return replaceAll('&amp;', '&', replaceAll('&lt;', '<', replaceAll('&gt;', '>', replaceAll('&quot;', '"', replaceAll('&apos;', "'", str)))));
}

/**
 *
 * @param str
 * @param callback
 * @private
 */
js_spec_module._xmlToJS = function (str, callback) {
    try {
        str = _parseEscapedString(str);
        defines.verbose(str);
        parseString(str, {trim: true}, callback);
    }
    catch (err) {
        callback(err.toString(), {});
    }
};

/**
 *
 * @param message
 * @private
 */
js_spec_module._log = function (message) {
    defines.verbose("JSSpec \t- " + message);
}

/**
 *
 * @returns {*}
 */
/*
 js_spec_module.specificationPath = function() {
 return path.join(process.cwd(), "api/specifications");
 }

 js_spec_module._plugins = {};
 js_spec_module.setupExpress = function (app) {
 defines.prettyLine("js.specification", defines.loaded);
 var files = fs.readdirSync(js_spec_module.specificationPath());
 for (var i in files) {
 var extension = path.extname(files[i]);
 if (extension == ".js") {
 var plugin_name = files[i].slice(0, -3);
 var definition = require(path.join(js_spec_module.specificationPath(), files[i]));
 js_spec_module._plugins[plugin_name] = definition;
 defines.prettyLine("   " + plugin_name, defines.loaded);

 //js_spec_module._log('specification ' + plugin_name + " " + defines.loaded);
 }
 }
 }
 */

// 1.0.4 specification format
/**
 *
 * @param plugin
 * @param validate
 * @param experimentSpecification
 * @param callback
 */
js_spec_module.run1_0_4Specification = function(plugin, validate, experimentSpecification, callback) {
    var equipment = undefined;
    if (validate) {

        /**
         * Validation equipment object
         */
        equipment = new function() {
            this.time = 0.0;
            this.run = function(action, args, success) {
                if (typeof success === 'undefined') {
                    success = args;
                    args = {};
                }
                js_validator.runAction(plugin.equipment + "." + action, args, true,
                    function (json) {
                        if (json.success) {
                            equipment.time += json.options.time;
                            if (equipment.time > plugin.timeout) {
                                defines.prettyConsole(colors.red("Validation timed out\n"));
                                return callback({success: false, errorMessage: "timeout"}, {});
                            }
                            return success(json);
                        }

                        // This action has failed. Kill the validation
                        defines.prettyConsole(colors.red("Killing validation: " + json.error + "\n"));
                        callback({accepted: false, errorMessage: json.error});
                    }
                );
            };
        };
    } else {

        /**
         * Execution equipment object
         */
        equipment = new function() {
            this.start = new Date();
            this.executionTime = function () {
                var diff = new Date().getTime() - this.start.getTime();
                return diff / 1000.0;
            }

            this.run = function(action, args, success) {
                if (typeof success === 'undefined') {
                    success = args;
                    args = {};
                }

                js_validator.runAction(plugin.equipment + "." + action, args, false,
                    function (json) {
                        if (json.success) {
                            if (equipment.executionTime() > plugin.timeout) {
                                defines.prettyConsole(colors.red("Experiment timed out\n"));
                                return callback({success: false, errorMessage: "timeout"}, {});
                            }
                            return success(json);
                        }

                        // This action has failed. Kill the experiment
                        defines.prettyConsole(colors.red("Killing experiment: " + json.error + "\n"));
                        callback({accepted: false, errorMessage: json.error});
                    }
                );
            };
        };
    }

    plugin.run(equipment, experimentSpecification, function (results) {
        if (validate) {
            defines.prettyConsole(colors.green("Validation successful\n"));
        } else {
            defines.prettyConsole(colors.green("Execution successful\n"));
        }

        callback({success: true, time: equipment.time}, results);
    }, validate);
}

// 1.0.3 specification format
/**
 *
 * @param plugin
 * @param validate
 * @param experimentSpecification
 * @param callback
 */
js_spec_module.run1_0_3Specification = function(plugin, validate, experimentSpecification, callback) {
    plugin.executeJSONSpecification(experimentSpecification, validate, callback);
}

/*
js_spec_module.findPlugin = function(experiment) {
    var equip = require("./equipment");
    var matches = experiment.match(RegExp("(.*)\\.(.*)"));
    if (matches.length == 3) {
        var equipment = matches[1];
        var spec = matches[2];

        if (equipment in equip.plugins()) {
            var plugin = equip.plugins()[equipment].getSpecification(spec);
            return plugin;
        }
    }
};
*/

js_spec_module.findSpecification = function(experiment) {
    var equip = require("./equipment");
    var matches = experiment.match(RegExp("(.*)\\.(.*)"));
    if (matches.length == 3) {
        var equipment = matches[1];
        var spec = matches[2];

        if (equipment in equip.plugins()) {
            var plugin = equip.plugins()[equipment].getSpecification(spec);
            return plugin;
        }
    }
};

/**
 *
 * @param experiment
 * @param validate
 * @param experimentSpecification
 * @param callback
 * @returns {*}
 * @private
 */
js_spec_module._executeJSONSpecification = function (experiment, validate, experimentSpecification, callback) {


    /*
    if (validate) {
        defines.prettyConsole("running validation on " + experiment + "\n");
    } else {
        defines.prettyConsole("executing " + experiment + "\n");
    }
    */

    var plugin = experiment;
    try {
        if (typeof plugin.run !== 'undefined' && typeof plugin.timeout !== 'undefined') { // 1.0.4
            js_spec_module.run1_0_4Specification(plugin, validate, experimentSpecification, callback);
        }
        else if (typeof plugin.executeJSONSpecification !== 'undefined') { // 1.0.3
            js_spec_module.run1_0_3Specification(plugin, validate, experimentSpecification, callback);
        }
    }
    catch (err) {
        return callback({accepted: false, errorMessage: err.toString()});
    }

}

/**
 *
 * @param format
 * @param experiment
 * @param validate
 * @param experimentSpecification
 * @param callback
 * @returns {*}
 */
js_spec_module.executeJSONSpecification = function (format, experiment, validate, experimentSpecification, callback) {
    defines.verbose("Creating JavaScript");
    switch (format) {
        case "xml":
            js_spec_module._xmlToJS(experimentSpecification, function (experiment, validate, callback) {
                return function (err, result) {
                    if (err) {
                        defines.verbose(experimentSpecification);
                        defines.verbose(err);
                        return callback({accepted: false, errorMessage: "XML parsing failed."});
                    }
                    js_spec_module._executeJSONSpecification(experiment, validate, result, callback);
                };
            }(experiment, validate, callback));

            break;
        case "json":
            js_spec_module._executeJSONSpecification(experiment, validate, experimentSpecification, callback);
            break;
        default:
            return callback({accepted: false, errorMessage: format + " is an invalid format"});
    }
}

js_spec_module.submitScript = function (broker, format, experiment, experimentSpecification, callback) {

    // Is this a valid specification?
    function invalid_plugin() {
        return callback({vReport: {accepted: false, errorMessage: experiment + " is an invalid name"}});
    }

    // Break up the equipment
    var equip = require("./equipment");
    var matches = experiment.match(RegExp("(.*)\\.(.*)"));
    if (matches.length != 3) {
        return invalid_plugin();
    }

    // Find the plugin
    var equipment = matches[1];
    var specification = matches[2];
    if (!(equipment in equip.plugins())) {
        return invalid_plugin();
    }

    // Find the specification
    var plugin = equip.plugins()[equipment];
    var spec   = plugin.getSpecification(specification);
    if (typeof spec === 'undefined') {
        return invalid_plugin();
    }

    // Execute the specification
    js_spec_module.executeJSONSpecification(format, spec, true, experimentSpecification, function (callback) {
        return function (validate, result) {
            if (validate.success == true) {
                var vReport = {accepted: true, estRuntime: validate.time};
                var experiment_data = {
                    type: "js_spec",
                    guid: (typeof broker !== 'undefined') ? broker.getGuid() : undefined,
                    vReport: vReport,
                    format: format,
                    experiment: specification,
                    experimentSpecification: experimentSpecification
                };

                experiment_data['experimentID'] = plugin.queue.incrementExperimentId();
                plugin.queue.add(experiment_data);

                var returnedData = {
                    vReport: vReport,
                    minTimeToLive: "0",
                    experimentID: experiment_data['experimentID'],
                    wait: {effectiveQueueLength: String(plugin.queue.queueLength()),
                        estWait: String(plugin.queue.estimatedWait())}
                };

                // Poll the queue
                plugin.pollQueue();
                return callback(returnedData);
            }
            else {
                var vReport = {accepted: false, errorMessage: validate.errorMessage};
                return callback({vReport: vReport});
            }
        }
    }(callback))
}

//JS Engine stuff //TODO: Fix
js_spec_module._javaScriptFromJSONSpecification = function (experiment, experimentSpecification, callback) {
    if (experiment in js_spec_module._plugins) {
        var plugin = js_spec_module._plugins[experiment];
        try {
            defines.verbose(JSON.stringify(experimentSpecification));
            plugin.javaScriptFromJSONSpecification(experimentSpecification, callback);
        }
        catch (err) {
            defines.verbose(err.toString());
            return callback({accepted: false, errorMessage: err.toString()});
        }
    }
    else
    {
        defines.verbose("invalid plugin");
        return callback({accepted: false, errorMessage: experiment + " is an invalid plugin"});
    }
}

js_spec_module.javaScriptFromSpecification = function (format, experiment, experimentSpecification, callback) {
    defines.verbose("Creating JavaScript with format '"+ format +"'");
    switch (format) {
        case "xml":
            defines.verbose("VALIDATING XML EXPERIMENT");
            js_spec_module._xmlToJS(experimentSpecification, function (experiment, callback) {
                return function (err, result) {
                    if (err) {
                        defines.verbose(experimentSpecification);
                        defines.verbose(err);
                        return callback({accepted: false, errorMessage: "XML parsing failed."});
                    }
                    js_spec_module._javaScriptFromJSONSpecification(experiment, result, callback);
                };
            }(experiment, callback));

            break;
        case "json":
            defines.verbose("VALIDATING JSON EXPERIMENT");
            js_spec_module._javaScriptFromJSONSpecification(experiment, experimentSpecification, callback);
            break;
        default:
            return callback({accepted: false, errorMessage: format + " is an invalid format"});
    }
}


