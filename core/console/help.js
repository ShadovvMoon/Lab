module.exports.run = function(args, callback) {
	for (plugin in lab_console.plugins) {
		var help_func = lab_console.plugins[plugin].help;
		if (typeof help_func !== 'undefined') {
			defines.prettyConsole(colors.bold(plugin) + "\n");
			help_func();
		}
	}
	callback();
}