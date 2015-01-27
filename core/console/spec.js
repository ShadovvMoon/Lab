var js_engine = require('../js_engine');
var js_validator = require('../js_validator');
var jsspec = require('../js_spec');
var queue = require('../queue');

function usage() {
    defines.prettyConsole("   Usage: spec <spec> <input json>\n");
}

module.exports.run = function(args, callback) {

    // Are the arguments valid?
    if (args.length < 2) {
        usage();
        return callback(EXIT_FAILURE);
    }

    var inputs = undefined;
    if (args.length > 2) {
        inputs = JSON.parse(args.slice(2));
    }

    // Submit an experiment to the queue
    jsspec.submitScript(undefined, 'json', args[1], inputs, function (clientReturn) {
        defines.prettyConsole(colors.yellow(JSON.stringify(clientReturn) + "\n"));
        queue.pollQueue();
        callback(EXIT_SUCCESS);
    });
}

module.exports.help = function() {
    defines.prettyConsole("   This command is used to run a specification\n");
    usage();
}
