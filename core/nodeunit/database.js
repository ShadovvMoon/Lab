/*
 * Copyright (c) 2014, Samuel Colbran <contact@samuco.net>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 
 * Redistributions in binary form must reproduce the above copyright notice, this
 * list of conditions and the following disclaimer in the documentation and/or
 * other materials provided with the distribution.
 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

require('./util.js');
exports.syncString = function(test){
	var db = require('../database.js');
	db.setValueForKey("test", "sample", "foo");
    test.ok((db.valueForKey("test", "sample") == "foo"),
		"Basic database syncronous string write/read test");
    test.done();
};

exports.syncInteger = function(test){
	var db = require('../database.js');
	db.setValueForKey("test", "sample", 5);
    test.ok((db.valueForKey("test", "sample") == 5),
		"Basic database syncronous integer write/read test");
    test.done();
};

exports.syncArray = function(test){
	var db = require('../database.js');
	var arr = [1,2,3,4,5]
	db.setValueForKey("test", "sample", arr);
    test.ok((db.valueForKey("test", "sample").equals(arr)),
		"Basic database syncronous array write/read test");
    test.done();
};

exports.syncComplex = function(test){
	var db = require('../database.js');
	var dict = {
		"foo": "bar",
		"4": 6
	};
	db.setValueForKey("test", "sample", dict);
    test.ok((db.valueForKey("test", "sample").equals(dict)),
		"Basic database syncronous complex write/read test");
    test.done();
};

exports.asyncString = function(test){
	var db = require('../database.js');
	var set = "foo";
	db.setValueForKey("test", "sample", set, function(){
		db.valueForKey("test", "sample", function(err, val) {
			test.ok(typeof err !== 'undefined',
				"Basic database asyncronous string write/read test (error)");
			test.ok(set == val,
				"Basic database asyncronous string write/read test");
    		test.done();
		});
	});
};

exports.asyncInteger = function(test){
	var db = require('../database.js');
	var set = 5;
	db.setValueForKey("test", "sample", set, function(){
		db.valueForKey("test", "sample", function(err, val) {
			test.ok(typeof err !== 'undefined',
				"Basic database asyncronous integer write/read test (error)");
			test.ok(set == val,
				"Basic database asyncronous integer write/read test");
    		test.done();
		});
	});
};

exports.asyncArray = function(test){
	var db = require('../database.js');
	var set = [1,2,3,4,5];
	db.setValueForKey("test", "sample", set, function(){
		db.valueForKey("test", "sample", function(err, val) {
			test.ok(typeof err !== 'undefined',
				"Basic database asyncronous array write/read test (error)");
			test.ok(set.equals(val),
				"Basic database asyncronous array write/read test");
    		test.done();
		});
	});
};

exports.asyncComplex = function(test){
	var db = require('../database.js');
	var set = {
		"foo": "bar",
		"4": 6
	};
	db.setValueForKey("test", "sample", set, function(){
		db.valueForKey("test", "sample", function(err, val) {
			test.ok(typeof err !== 'undefined',
				"Basic database asyncronous complex write/read test (error)");
			test.ok(set.equals(val),
				"Basic database asyncronous complex write/read test");
    		test.done();
		});
	});
};

exports.keyCheck = function(test){
	var db = require('../database.js');
	db.setValueForKey("test", "sample", "foo");
    test.ok(db.valueForKey("test", "sample") == "foo", 'write/read');
	test.ok(db.getKeys("test").equals(['sample']), "getKeys");
	test.done();
};

exports.removeKey = function(test){
	var db = require('../database.js');
	db.setValueForKey("test", "sample", "foo");
    test.ok(db.valueForKey("test", "sample") == "foo", 'write/read');
	test.ok(db.getKeys("test").equals(['sample']),
				"Basic database getKeys check");
	db.removeValueForKey("test", "sample");
	test.ok(db.getKeys("test").equals([]),
				"Basic database getKeys check");
	test.done();
};

