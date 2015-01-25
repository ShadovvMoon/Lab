function shell_prompt() {
	rl.question(">>> ", function (command) {
		var args = command.split(" ");
		if (args.length > 0) {
			// Does this correspond to another plugin?
			var plugin = args[0];
			if (plugin in lab_console.plugins) {
				return lab_console.plugins[plugin].run(args, function(error_status){
					return shell_prompt();
				});
			}
		}
		return shell_prompt();
	});
}

module.exports.run = function(args, callback) {
	shell_prompt();
}