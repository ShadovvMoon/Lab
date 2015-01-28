module.exports.timeout = 60; // seconds
module.exports.run = function(equipment, inputs, callback) {
    var times = inputs['number'];

	// Run the test_1 numerous times
	var output = [];
	defines.asyncLoop(times, function(loop) {
		equipment.run("test_1", function(results) {
			output.push(results);
			loop.next();
		});
	}, function() {
		return callback(output);
	});
};