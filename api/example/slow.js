module.exports.timeout = 60; // seconds
module.exports.run = function(equipment, inputs, callback) {
    var times = 120;

	// Run the sin action 120 times
	var output = [];
	defines.asyncLoop(times, function(loop) {
		equipment.run("sin", 5, function(results) {
			output.push(results);
			loop.next();
		});
	}, function() {
		return callback(output);
	});
};