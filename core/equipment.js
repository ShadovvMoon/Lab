/*
 * Copyright (c) 2015, Samuel Colbran <contact@samuco.net>
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

path  = require("path");
queue = require("./queue");
database = require("./database");

js_spec      = require('./js_spec.js')
js_validator = require('./js_validator.js');

var equipment = module.exports;

equipment._plugins = {};
equipment.plugin_path = function() {
    return path.join(process.cwd(), "api");
};
equipment.plugins = function() {
    return equipment._plugins;
};

/**
 *
 * @param plugin
 * @param specification
 * @returns {*}
 */
function load_specification(plugin, specification) {
    var location = path.join(equipment.plugin_path(), plugin, specification+".js");
    var spec = require(location);
    spec.equipment = plugin;
    return spec;
}

/**
 *
 * @param plugin
 * @param callback
 */
function load_specifications(plugin, callback) {
    var specifications = {};
    var location = path.join(equipment.plugin_path(), plugin);
    fs.readdir(location, function(err, files) {
        if (err) {
            return callback(err);
        }

        // Loop through the specifications
        defines.asyncLoop(files.length, function (loop) {
            var file = files[loop.iteration()];
            if (path.extname(file) == ".js") {

                // Remove the extension
                var spec_name = file.substring(0, file.indexOf(path.extname(file)));
                specifications[spec_name] = load_specification(plugin, spec_name);
            }
            loop.next();
        }, function() {
            callback(undefined, specifications);
        });
    });
}

/**
 *
 * @param name
 * @param actions
 * @param specifications
 */
function build_plugin(name, actions, specifications, callback) {
    return new function() {
        var plugin = this;
        plugin.name = name;
        plugin._actions = actions;
        plugin._specifications = specifications;

        /**
         *
         * @param name
         * @returns {*}
         */
        plugin.getSpecification = function(name) {
            return plugin._specifications[name];
        };

        plugin.getAction = function(name) {
            return plugin._actions[name];
        };

        plugin._status_code = defines.idle_status;

        /**
         *
         * @returns {number}
         */
        plugin.getStatusCode = function()
        {
            return plugin._status_code;
        };

        /**
         *
         * @returns {string}
         */
        plugin.getStatus = function()
        {
            var status_code = plugin.getStatusCode();
            switch(status_code)
            {
                case 0:
                    return "1: Idle";
                default:
                    return "Unknown status code";
            }
        };

        plugin._experimentId = -1;
        plugin._experimentGUID = undefined;

        /**
         *
         * @param experimentSpecification
         * @private
         */
        plugin._runExperiment = function(experimentSpecification) {
            //Turn on the equipment
            plugin._status_code = defines.starting_status;

            //<start the equipment>

            //Send the specification to the experiment machinery
            plugin._status_code = defines.running_status;

            // Run the experiment specification
            try {
                plugin._experimentGUID = experimentSpecification['guid'];
                if (experimentSpecification['type'] == 'js_spec') {
                    var specification = plugin._specifications[experimentSpecification['experiment']];
                    js_spec.executeJSONSpecification(experimentSpecification['format'],
                        specification,
                        false,
                        experimentSpecification['experimentSpecification'],

                        function (validate, result) {
                            if (validate.success === true) {
                                defines.verbose("experiment successful");
                                plugin._status_code = defines.finishing_status;
                                plugin._finishExperiment(result);
                            }
                            else {
                                defines.prettyConsole(colors.red("experiment failed - " + JSON.stringify(validate.errorMessage) + "\n"));
                                plugin._status_code = defines.finishing_status;
                                plugin._finishExperiment({});
                            }
                        }
                    );
                }
            } catch (err) {
                defines.prettyConsole(colors.red(plugin.name + " error occurred " + err.toString() + "\n"));

                plugin._experimentGUID = "";
                plugin._status_code = defines.finishing_status;
                plugin._finishExperiment({});
            }
        }

        plugin._runningExperiment = function()
        {
            return ((plugin._status_code != defines.idle) ? plugin._experimentId : -1);
        };

        plugin.startExperiment = function(experiment_data) {
            plugin._experimentId = experiment_data['experimentID'];
            plugin._runExperiment(experiment_data);
        }

        plugin._finishExperiment = function(json) {
            defines.verbose("finishing experiment...");

            //Save the results to the database
            var current_experiment = plugin._runningExperiment();//queue.nextExperiment()-1;

            plugin.queue.pop(); // remove the experiment from the queue
            defines.prettyLine(plugin.name, "finishing " + current_experiment);


            // TODO: Use SQL
            database.valueForKey("results", plugin.name, function(err, results) {
                defines.prettyConsole(colors.cyan("saving results..."));
                if (typeof results === 'undefined') {
                    results = {};
                }

                results[current_experiment] = json;
                database.setValueForKey("results", plugin.name, results, function() {
                    defines.prettyConsole(colors.green("done!\n"));

                    //Turn off the equipment
                    defines.verbose("experiment complete!");

                    //Notify the broker that the results are now available
                    if (typeof plugin._experimentGUID !== 'undefined') {
                        var broker_object = broker.findBroker(plugin._experimentGUID);
                        if (typeof broker_object !== 'undefined') {
                            broker_object.sendData({action: "notify",
                                experimentId: plugin._experimentId
                            }, function (response, status) {
                                defines.verbose(response + " " + status);
                                defines.prettyLine("notifying broker", experimentId);
                            });
                        }
                    }

                    //Remove the experiment from the queue
                    //queue.removeExperiment(current_experiment);
                    plugin._status_code = defines.idle_status;

                    //Poll the queue (start the next experiment in the queue)
                    plugin.pollQueue();
                });
            });
        }

        /**
         *
         * @type {null}
         * @private
         */
        plugin._refreshTimer = null;

        /**
         * Checks the state of queue
         */
        plugin.pollQueue = function() {
            if (plugin._refreshTimer) {
                clearTimeout(plugin._refreshTimer);
                plugin._refreshTimer = null;
            }

            var state = plugin.queue.getState();
            switch (state) {
                case queue.queueState.READY:

                    //Is there an experiment currently running?
                    var experiment_status = plugin.getStatusCode();
                    if (experiment_status != defines.idle_status) {
                        defines.prettyLine(plugin.name, "busy (" + plugin.queue.queueLength() + ")");
                        break;
                    }

                    // Start the next experiment
                    var experiment = plugin.queue.getNext();
                    var experimentId = experiment['experimentID'];
                    defines.prettyLine(plugin.name, "starting " + experimentId);
                    experiment.queueStatus = defines.kRunning;
                    plugin.queue.save(function () {
                        plugin.startExperiment(experiment);
                    });
                    break;

                case queue.queueState.RESTRICTED:
                    defines.prettyLine(plugin.name, "restricted (" + plugin.queue.queueLength() + ")");
                    plugin._refreshTimer = setTimeout(plugin.pollQueue, 60 * 1000);
                    break;

                case queue.queueState.EMPTY:
                    defines.prettyLine(plugin.name, "available");
                    break;
            }
        };

        /**
         * Queue
         */
        plugin.vQueue = queue.createQueue();
        plugin.vQueue.load("queue-verify-"+plugin.name, function(){
            plugin.queue = queue.createQueue();
            plugin.queue.load("queue-"+plugin.name, function(){
                callback(undefined, plugin);
            });
        });
    }
}

/**
 *
 * @param plugin
 * @param callback
 */
function load_plugin(plugin, callback) {

    // Read actions from the plugin file
    var actions = require(path.join(equipment.plugin_path(), plugin + ".js")).actions;
    defines.prettyLine("   " + plugin, defines.loaded);
    defines.prettyConsole("      actions\n");

    // Print out each action
    for (key in actions) {
        defines.prettyConsole("         " + key + "\n");
    }

    // Read any specifications
    defines.prettyConsole("      specifications\n");
    load_specifications(plugin, function(err, specifications) {
        if (err) {
            return callback(err);
        }

        // Print specification names
        for (key in specifications) {
            defines.prettyConsole("         " + key + "\n");
        }

        build_plugin(plugin, actions, specifications, callback);
    });
}

/**
 *
 * @param callback
 */
equipment.load_plugins = function(callback) {
    equipment._plugins = {};
    defines.prettyLine("equipment", defines.loaded);
    fs.readdir(equipment.plugin_path(), function(err, files) {
        if (err) {
            return callback(err);
        }

        // Loop through the plugins
        defines.asyncLoop(files.length, function(loop) {
            var file = files[loop.iteration()];
            if (path.extname(file) == ".js") {

                // Remove the extension
                var plugin_name = file.substring(0, file.indexOf(path.extname(file)));
                load_plugin(plugin_name, function(err, plugin) {
                    if (err) {
                        return callback(err);
                    }

                    equipment._plugins[plugin_name] = plugin;
                    loop.next();
                });
            } else {
                loop.next();
            }
        }, function() {
            callback();
        });
    });
}

equipment.pollPlugins = function() {
    for (key in equipment._plugins) {
        equipment._plugins[key].pollQueue();
    }
}

