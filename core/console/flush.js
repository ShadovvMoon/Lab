var js_engine = require('../js_engine');
var js_validator = require('../js_validator');
var jsspec = require('../js_spec');
var equipment = require('../equipment');

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
		defines.prettyConsole("Reloading equipment\n");
		equipment.load_plugins(function(err){
            return finish(err);
		});
	}

	// Clear the existing cached files
	function flush(reload) {

        // Flush the equipment
		fs.readdir(equipment.plugin_path(), function(err, files) {
	        if (err) {
				return finish(err);
	        }
	
	        // Loop through the files
	        defines.asyncLoop(files.length, function(loop) {
	            var file = files[loop.iteration()];
	            if (path.extname(file) == ".js") {
                    defines.prettyLine("flushing", file);

	                // Load the actions from the file
					delete require.cache[require.resolve(path.join(equipment.plugin_path(), file))];
                    var plugin_name = path.basename(file);
                    plugin_name = plugin_name.substring(0, plugin_name.indexOf(path.extname(file)));

                    // Delete the specification caches
                    fs.readdir(path.join(equipment.plugin_path(), plugin_name), function(err, specs) {
                        if (err) {
                            return finish(err);
                        }
                        defines.asyncLoop(specs.length, function(spec_loop) {
                            var file = specs[spec_loop.iteration()];
                            if (path.extname(file) == ".js") {
                                defines.prettyLine("flushing", file);

                                // Load the actions from the file
                                delete require.cache[require.resolve(path.join(equipment.plugin_path(), plugin_name, file))];
                            }
                            spec_loop.next();
                        }, loop.next);
                    });
				} else {
                    loop.next();
                }
			}, reload);
		});
	}
	flush(reload);
}

module.exports.help = function() {
    defines.prettyConsole("   This command is used to reload api files\n");
    usage();
}