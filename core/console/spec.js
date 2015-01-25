var js_engine = require('../js_engine');
var js_validator = require('../js_validator');
var jsspec = require('../js_spec');

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
	
}

module.exports.help = function() {
    defines.prettyConsole("   This command is used to run a specification\n");
    usage();
}