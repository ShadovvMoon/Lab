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

var Heap = require('heap');
var db = require("./database");

module.exports.queueState = Object.freeze({
    EMPTY: 1,
    READY: 2,
    RESTRICTED: 3
});

module.exports.createQueue = function() {
    return new function() {
        var queue = this;
        queue._database = undefined;
        queue._heap = undefined;

        var heap_compare = function (a, b) {
            return parseInt(a.experimentID) - parseInt(b.experimentID);
        };

        /**
         * Add an experiment to the queue
         * @param experiment
         */
        queue.add = function(experiment) {
            Heap.push(queue._heap, experiment, heap_compare);
            queue.save(function() {

            });
        }

        /**
         * Sets the memory queue
         * @param cache
         * @private
         */
        queue._load = function (heap) {
            queue._heap = (typeof heap !== 'undefined') ? heap : [];
        };

        /**
         * Save the queue to the database
         * @param callback
         */
        queue.save = function (callback) {
            db.setValueForKey("queue", queue._database, queue._heap, function () {
                callback();
            })
        };

        /**
         * Loads the queue from the database
         */
        queue.load = function (database, callback) {
            queue._database = database;
            db.valueForKey("queue", queue._database, function (err, cache) {
                queue._load(cache);
                callback();
            });
        };

        /**
         * Checks whether an experiment is restricted
         * @param experiment
         * @returns {boolean}
         */
        queue.isRestricted = function (experiment) {
            var guid = experiment['guid'];
            if (typeof guid !== 'undefined') {
                var broker_name = broker.findBroker(guid).getName();
                var runtime = queued_experiment['vReport']['estRuntime'];
                if (!calendar.hasAccess(broker_name, runtime)) {
                    return true;
                }
            }
            return false;
        };

        /**
         *
         * @returns {*}
         */
        queue.pop = function() {
            return Heap.pop(queue._heap, heap_compare);
        }

        /**
         * Returns the next experiment to run
         * @returns {*}
         */
        queue.getNext = function () {
            if (queue._heap.length == 0) {
                return undefined;
            }

            // Is the top experiment suitable?
            var top = queue._heap[0];
            if (!queue.isRestricted(top)) {
                return top;
            }

            // Rebuild the heap order and try again
            Heap.heapify(queue._heap, heap_compare);
            var top = queue._heap[0];
            if (!queue.isRestricted(top)) {
                return top;
            }

            // The queue is restricted
            return undefined;
        };

        /**
         * Returns the state of the heap
         * @returns {number}
         */
        queue.getState = function () {
            if (queue._heap.length > 0) {
                if (typeof queue.getNext() !== 'undefined') {
                    return module.exports.queueState.READY;
                } else {
                    return module.exports.queueState.RESTRICTED;
                }
            } else {
                return module.exports.queueState.EMPTY;
            }
        };

        // Copy event properties
        var events = require("events");
        queue.__proto__ = events.EventEmitter.prototype;

        // 1.0.3 functions
        queue.containsExperiment = function (experimentID) {
            var ram_queue = queue._heap;
            var i;
            for (i = 0; i < ram_queue.length; i++) {
                var queued_experiment = ram_queue[i];
                if (queued_experiment['experimentID'] == experimentID) {
                    return true;
                }
            }
            return false;
        };

        /**
         *
         * @param experimentID
         * @returns {boolean}
         */
        queue.removeExperiment = function(experimentID) {
            var ram_queue = queue._heap;
            var i;
            for (i=0; i < ram_queue.length; i++)
            {
                var queued_experiment = ram_queue[i];
                if (parseInt(queued_experiment['experimentID']) == parseInt(experimentID))
                {
                    defines.prettyLine("experiment queue", "deleted " + experimentID);
                    ram_queue.splice(i,1);
                    queue.save(function() {

                    });
                    return true;
                }
            }
            defines.prettyLine("experiment queue", "missing" + experimentID);
            return false;
        };

        /**
         * Return the current queue length
         * @returns {Number} - queue length
         */
        queue.queueLength = function () {
            return queue._heap.length;
        };

        /**
         * Return the estimated time until all experiments are completed
         * @returns {number} - estimated time
         */
        queue.estimatedWait = function () {
            //TODO: Handle queue priority

            // Go through each experiment in the queue and calculate the total wait time
            var ram_queue = queue._heap;
            var time = 0;
            for (var i = 0; i < ram_queue.length; i++) {
                var vReport = ram_queue[i].vReport;
                if (typeof vReport !== 'undefined') {
                    time += vReport.estRuntime;
                }
            }
            return time;
        };

        /**
         * Returns the next experiment id
         * @returns int - next id
         */
        queue.nextExperiment = function () {
            var next_experiment = db.valueForKey("settings", "next_experiment", undefined);
            next_experiment = (typeof next_experiment !== 'undefined') ? next_experiment : 0;
            return next_experiment;
        };

        /**
         * Increments the next experiment id
         * @returns int - next id
         */
        queue.incrementExperimentId = function () {
            var next_experiment = queue.nextExperiment();
            next_experiment++;
            db.setValueForKey("settings", "next_experiment", next_experiment, undefined);
            return next_experiment - 1;
        };
    }
};


