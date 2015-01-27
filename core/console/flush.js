var js_engine = require('../js_engine');
var js_validator = require('../js_validator');
var jsspec = require('../js_spec');

function usage() {
    defines.prettyConsole("   Usage: flush\n");
}

module.exports.run = function(args, callback) {

	function finish(err) {
		if (err) {
			return callback(EXIT_FAILURE);
		}
		return callback(EXIT_SUCCESS);
	}

	function reload() {
		defines.prettyConsole("Reloading js.engine.api\n");
		js_engine.loadActions(function(err){

            defines.prettyConsole("Reloading js.spec.api\n");
            jsspec._plugins = {};
            jsspec.setupExpress();

            return finish(err);
		});
	}

	// Clear the existing cached files
	function flush(reload) {

        // Flush JSEngine
		fs.readdir(js_engine.apiPath(), function(err, files) {
	        if (err) {
				return finish(err);
	        }
	
	        // Loop through the files
	        defines.asyncLoop(files.length, function(loop) {
	            var file = files[loop.iteration()];
	            if (path.extname(file) == ".js") {
	
	                // Load the actions from the file
					delete require.cache[require.resolve(path.join(js_engine.apiPath(), file))];
				}
				loop.next();
			}, function() {

                // Flush JSSpec
                fs.readdir(jsspec.specificationPath(), function(err, files) {
                    if (err) {
                        return finish(err);
                    }

                    // Loop through the files
                    defines.asyncLoop(files.length, function(loop) {
                        var file = files[loop.iteration()];
                        if (path.extname(file) == ".js") {

                            // Load the actions from the file
                            delete require.cache[require.resolve(path.join(jsspec.specificationPath(), file))];
                        }
                        loop.next();
                    }, reload);
                });
            });
		});


	}
	flush(reload);
}

module.exports.help = function() {
    defines.prettyConsole("   This command is used to reload api files\n");
    usage();
}