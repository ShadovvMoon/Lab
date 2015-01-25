colors = require('colors/safe');

lab_console = module.exports;
lab_console.plugins = {};

// Exit statuses
EXIT_SUCCESS=0
EXIT_FAILURE=1

/**
 *
 * @returns {string}
 */
function console_path() {
    return "./core/console";
}

/**
 *
 * @param plugin
 */
function load_plugin(plugin_path, callback) {
    var plugin = require(plugin_path);
    var plugin_name = path.basename(plugin_path);
    lab_console.plugins[plugin_name.substr(0,
        plugin_name.indexOf(path.extname(plugin_name)))] = plugin;
    callback();
}

/**
 *
 * @param callback
 */
function load_plugins(callback) {
    fs.readdir(path.join(process.cwd(), console_path()), function(err, files) {
        if (err) {
            return callback(err);
        }

        defines.asyncLoop(files.length, function(loop) {
            var file = files[loop.iteration()];
            if (path.extname(file) == ".js") {
                load_plugin(path.join(process.cwd(), console_path(), file), loop.next);
            } else {
                loop.next();
            }
        }, function() {
            callback();
        });
    });
}

/**
 *
 * @param callback - function(err)
 */
lab_console.setup = function(callback) {
    load_plugins(function(err) {
        defines.prettyLine("console", defines.loaded);
        callback(err);
    });
}

lab_console.run = function() {
    lab_console.plugins['shell'].run([], function(exit_status) {
        lab_console.run();
    });
}