var js_engine = require('../js_engine');
var js_validator = require('../js_validator');

function usage() {
    defines.prettyConsole("   Usage: verify <action> <args>\n");
}

module.exports.run = function(args, callback) {

    // Are the arguments valid?
    if (args.length < 3) {
        usage();
        return callback(EXIT_FAILURE);
    }

    try {
        js_validator.runAction(args[1],
            JSON.parse(args.slice(2)),
            true,
            function (json) {
                if (json.success) {
                    defines.prettyConsole(colors.green("Action is valid\n") +
                        "Estimated execution time: " + json.options.time + " second(s)\n");
                } else {
                    defines.prettyConsole(colors.red("Action is invalid\n"));
                    defines.prettyConsole(json.error);

                }
                return callback(EXIT_SUCCESS);
            });
    } catch (e) {
        defines.prettyConsole(colors.red("Invalid input\n"));
        usage();
        return callback(EXIT_FAILURE);
    }

}

module.exports.help = function() {
    defines.prettyConsole("   This command is used to verify a machine action.\n");
    usage();
}