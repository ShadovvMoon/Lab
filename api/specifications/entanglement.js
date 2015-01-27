module.exports.timeout = 60; // seconds
module.exports.run = function(equipment, inputs, callback) {
	
	// Read 5 measurements from the equipment
	var output = [];
	defines.asyncLoop(5, function(loop) {
        equipment.run("motor1", 5, function(results) {

        });


		equipment.run("counts", function(results) {
			output.push(results);
			loop.next();
		});
	}, function() {
		return callback(output);
	});
};