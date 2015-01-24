module.exports.run = function(args, callback) {
	rl.question(">>> ", function (command) {
		var args = command.split(" ");
		if (args.length > 0) {
			// Does this correspond to another plugin?
			var plugin = args[0];
			if (plugin in lab_console.plugins) {
				return lab_console.plugins[plugin].run(args, callback);
			}
		}
		return callback();
	});
}