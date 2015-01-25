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
    var params = json.params;
    var experimentID            = params['experimentID'];
    var experimentSpecification = params['experimentSpecification'];
    var specificationFormat		= params['specificationFormat'];
    var specificationID			= params['specificationID'];
    var userGroup               = params['userGroup'];
    var priorityHint            = params['priorityHint'];

    console.log(experimentSpecification);
    console.log(specificationID);
    console.log(params);
    //Permissions check
    if (!broker._permissions.batched) {
        return broker.sendError("You do not have permission to submit batched lab experiments");
    }
    else if (broker._permissions.specifications.indexOf(specificationID) == -1) {
        return broker.sendError("You do not have permission to use the '"+ specificationID +"' specification.");
    }
    else if (!broker._permissions.js_engine && specificationFormat == "js") {
        return broker.sendError("You do not have permission to use the Javascript Engine.");
    }

    //Experiment evaluation engine
    var submission = function (client, broker) {
        return function (options) {
            if (options.accepted) {
                jsengine.submitScript(broker,
                    options.script,
                    function (clientReturn)
                    {
                        broker.sendData(clientReturn);
                        queue.pollQueue();
                    });
            }
        };
    }(broker._client, broker);

    defines.verbose("Submitted experiment " + specificationFormat);
    if (specificationFormat == "xml" || specificationFormat == "json" || typeof specificationFormat == 'undefined') {
        specificationFormat = (specificationFormat == 'json') ? 'json' : 'xml';
        /*var useJSEngine = false; //NO reason to use the JS engine!
         if (useJSEngine) {
         defines.verbose("Creating specification with JSSpec");
         jsspec.javaScriptFromSpecification(specificationFormat, specificationID,
         experimentSpecification, submission);
         }
         else {*/
        jsspec.submitScript(broker, specificationFormat,
            specificationID, experimentSpecification,
            function (client, broker) {
                return function (clientReturn) {
                    broker.sendData(clientReturn);
                    queue.pollQueue();
                };
            }(broker._client, broker));
        //}
    }
    else if (specificationFormat == "js") {
        submission({accepted: true, script: experimentSpecification});
    }
    else {
        return broker.sendError("The specification format '"+ specificationFormat +"' does not exist.");
    }
}