module.exports.timeout = 60; // seconds
module.exports.run = function(equipment, inputs, callback) {
    var times = inputs['number'];

	// Read 5 measurements from the equipment
	var output = [];
	defines.asyncLoop(times, function(loop) {
		equipment.run("counts", function(results) {
			output.push(results);
			loop.next();
		});
	}, function() {
		return callback(output);
	});
};