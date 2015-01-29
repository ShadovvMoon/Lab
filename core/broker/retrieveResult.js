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

module.exports.receiveData = function(broker, json) {
    var experimentID     = json.params['experimentID'];

    // Is this experiment sitting in one of the queues?
    var equipment = require("../equipment");
    for (key in equipment.plugins()) {
        var plugin = equipment.plugins()[key];
        if (plugin.queue.containsExperiment(experimentID)) {
            experimentStatus = plugin.queue.experimentStatus(experimentID);
            return broker.sendData({statusCode: experimentStatus});
        }
    }

    // Has this experiment been completed?
    var plugin_results = database.getKeys("results");
    for (key in plugin_results) {
        database.valueForKey("results", key, function(results) {
            if (experimentID in results) {
                return broker.sendData({statusCode: defines.kFinished,
                    experimentResults: results[experimentID]});
            }
        });
    }

    // We haven't found the experiment. It must not exist.
    return broker.sendData({
        statusCode: defines.kInvalidExperiment
    });



    /*
    var experimentStatus = experiment.experimentStatus(experimentID);

    var completed_experiments = database.getKeys("results");
    if (completed_experiments.indexOf(''+experimentID) != -1) {
        //Experiment has been completed and the results are available.
        //defines.kFinished
        var results = database.valueForKey("results", experimentID, undefined);
        return broker.sendData({statusCode: experimentStatus,
            experimentResults: results});
    }
    else {
        return broker.sendData({statusCode: experimentStatus});
    }
    */

}