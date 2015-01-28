var queue  = require("../queue.js");
var assert = require("assert");

/* NOTE: These tests assume the lab is not in use */
describe('queue', function() {
    describe('#startQueue', function() {
        it('should empty and start the queue', function (done) {

            // Empty the queue
            var db = require("../database.js");
            db.setValueForKey("queue", "cache", []);

            // Start the queue
            queue.startQueue(done);
        });
    });

    describe('#estimatedWait', function() {
        it('should be 0 when the queue is empty', function () {
            assert.equal(queue.estimatedWait(), 0);
        });

        /*it('should not be 0 when the queue has experiments', function () {
         // Add an experiment to the queue


         assert.equal(queue.estimatedWait(), 0);
         });
         */
    });

    describe('#getEffectiveQueueLength', function() {
        it('should be empty when the queue is empty', function () {
            assert.equal(queue.getEffectiveQueueLength().equals(
                {
                    effectiveQueueLength: "0",
                    estWait: "0"
                }), true);
        });
    });

    describe('#add', function() {

        // Add an experiment to the queue
        it('should successfully add to the queue', function () {
            var vReport = {accepted: true, estRuntime: 1.0};
            var experiment_data = {
                type: "js_spec",
                guid: undefined,
                vReport: vReport,
                format: 'json',
                experiment: 'test',
                experimentSpecification: {}
            };

            experiment_data['experimentID'] = queue.incrementExperimentId();
            queue.add(experiment_data);
        });

        it('should update the estimated wait time', function () {
            assert.notEqual(queue.estimatedWait(), 0);
        });

        // Start the experiment
        it('should start the experiment', function () {
            queue.pollQueue();
        });
    });
});