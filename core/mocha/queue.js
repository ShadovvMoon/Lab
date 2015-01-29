var queue  = require("../queue.js");
var assert = require("assert");
var db     = require("../database");

/* NOTE: These tests assume the lab is not in use */
describe('queue', function() {

    // clear the existing queue if one exists
    function clearQueue(callback) {
        db.setValueForKey("queue", "test-queue", [], function () {
            callback();
        })
    };

    describe('#createQueue', function() {
        it('should create an empty queue', function (done) {
            var testQueue = queue.createQueue();
            clearQueue(function() {
                testQueue.load("test-queue", function() {
                    assert.equal(testQueue.queueLength(), 0);
                    assert.equal(testQueue.estimatedWait(), 0);
                    delete testQueue;
                    done();
                });
            });
        });
    });

    describe('#add', function() {
        it('should add the experiments', function (done) {
            var testQueue = queue.createQueue();
            clearQueue(function() {
                testQueue.load("test-queue", function() {
                    assert.equal(testQueue.queueLength(), 0);
                    assert.equal(testQueue.estimatedWait(), 0);
                    assert.equal(testQueue.getNext(), undefined);
                    assert.equal(testQueue.getState(), queue.queueState.EMPTY);

                    var second = {
                        "experimentID" : 5,
                        "guid" : undefined,
                        "vReport" : {estRuntime: 15}
                    };
                    testQueue.add(second);

                    assert.equal(testQueue.getState(), queue.queueState.READY);
                    assert.equal(testQueue.queueLength(), 1);
                    assert.equal(testQueue.estimatedWait(), 15);

                    var first = {
                        "experimentID" : 2,
                        "guid" : undefined,
                        "vReport" : {estRuntime: 20}
                    };
                    testQueue.add(first);

                    assert.equal(testQueue.getState(), queue.queueState.READY);
                    assert.equal(testQueue.queueLength(), 2);
                    assert.equal(testQueue.estimatedWait(), 35);

                    // Check if the queue contains these experiments
                    assert.equal(testQueue.containsExperiment(first.experimentID), true);
                    assert.equal(testQueue.containsExperiment(8), false);
                    assert.equal(testQueue.containsExperiment(3), false);
                    assert.equal(testQueue.containsExperiment(second.experimentID), true);

                    // Pop the experiments
                    assert.equal(testQueue.getNext().equals(first), true);
                    assert.equal(testQueue.pop().equals(first), true);
                    assert.equal(testQueue.queueLength(), 1);
                    assert.equal(testQueue.estimatedWait(), 15);
                    assert.equal(testQueue.getNext().equals(second), true);
                    assert.equal(testQueue.pop().equals(second), true);
                    assert.equal(testQueue.queueLength(), 0);
                    assert.equal(testQueue.estimatedWait(), 0);
                    assert.equal(testQueue.getNext(), undefined);
                    assert.equal(testQueue.getState(), queue.queueState.EMPTY);

                    delete testQueue;
                    done();
                });
            });
        });
    });

    describe('#experiment id', function() {
        it('should increment', function (done) {
            var testQueue = queue.createQueue();
            clearQueue(function() {
                testQueue.load("test-queue", function () {
                    var next = testQueue.nextExperiment();
                    testQueue.incrementExperimentId();
                    assert.equal(testQueue.nextExperiment(), next+1);

                    delete testQueue;
                    done();
                })
            });
        });
    });

    /*
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
            assert.equal(queue_1.estimatedWait(), 0);
        });
    });

    describe('#getEffectiveQueueLength', function() {
        it('should be empty when the queue is empty', function () {
            assert.equal(queue_1.getEffectiveQueueLength().equals(
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

            experiment_data['experimentID'] = queue_1.incrementExperimentId();
            queue_1.add(experiment_data);
        });

        it('should update the estimated wait time', function () {
            assert.notEqual(queue_1.estimatedWait(), 0);
        });

        // Start the experiment
        it('should start the experiment', function () {
            queue_1.pollQueue();
        });
    });
    */
});