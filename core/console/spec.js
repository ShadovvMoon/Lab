var js_engine = require('../js_engine');
var js_validator = require('../js_validator');
var jsspec = require('../js_spec');
var queue = require('../queue');

function usage() {
    defines.prettyConsole("   Usage: spec <spec> <input json>\n");
}

module.exports.run = function(args, callback) {

    // Are the arguments valid?
    if (args.length < 3) {
        usage();
        return callback(EXIT_FAILURE);
    }

    // Submit an experiment to the queue
    jsspec.submitScript(undefined, 'json', args[1], JSON.parse(args[2]), function (clientReturn) {
        console.log(clientReturn);
        queue.pollQueue();
    });
}

/*
 module.exports.help = function() {
 defines.prettyConsole("   This command is used to run a specification\n");
 usage();
 }
 */