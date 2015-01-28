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
var assert = require("assert")

describe('database', function(){
    describe('#setValueForKey', function() {
        function setTest(key, value, done) {
            var db = require('../database.js');
            db.setValueForKey("test-sync", key, value);
            assert.equal(value.equals(db.valueForKey("test-sync", key)), true);

            db.setValueForKey("test-async", key, value, function (err) {
                db.valueForKey("test-async", key, function (err, stored) {
                    assert.equal(value.equals(stored), true);
                    done();
                });
            });
        }

        it('should work with strings', function (done) {
            setTest("sample", "foo", function() {
                setTest("sample", "frog", function() {
                    setTest("foo", "sample", function() {
                        setTest("", "", function() {
                            setTest("", "     foo     ", done);
                        });
                    });
                });
            });
        });

        it('should work with integers', function (done) {
            setTest("sample", 5, function() {
                setTest("sample", -1, function() {
                    setTest("foo", -500000, function() {
                        setTest("", 0, function() {
                            setTest(0, "     foo     ", done);
                        });
                    });
                });
            });
        });

        it('should work with arrays', function (done) {
            setTest("sample", [1, 2, 3, 4], function() {
                setTest("sample", [], function() {
                    setTest("foo", [1, 2, 3, 4, 5], function() {
                        setTest([1, 2, 3, 4], [5, 4, 3, 2], function() {
                            setTest([], [], done);
                        });
                    });
                });
            });
        });

        it('should work with dictionaries', function (done) {
            setTest("sample", {
                "foo": 5,
                "": 10,
                "4": 3,
                0: -1,
                "array": [1, 2, 3, 4, 5]
            }, function() {
                setTest("sample", {
                    "nested": {
                        "another": {
                            "more": {
                                "lots": [1, 2, 3, 4, 5]
                            }
                        },
                        "foo": 5
                    }
                }, done);
            });
        });
    });

    describe('#valueForKey', function() {
        it('should return undefined for missing keys', function (done) {
            var db = require('../database.js');
            assert.equal(db.valueForKey("test-sync", "missing"), undefined);
            db.valueForKey("test-async", "missing", function (err, stored) {
                assert.equal(stored, undefined);
                done();
            });
        });
    });

    describe('#getKeys', function() {
        it('should return keys array', function (done) {
            var db = require('../database.js');
            db.setValueForKey("test-keys", "sample", "foo");
            assert.equal(db.valueForKey("test-keys", "sample"), "foo");
            assert.equal(db.getKeys("test-keys").equals(['sample']), true);
            done();
        });
    });

    describe('#removeValueForKey', function() {
        it('should remove keys (sync)', function (done) {
            var db = require('../database.js');
            db.setValueForKey("test-remove", "sample", "foo");
            assert.equal(db.valueForKey("test-remove", "sample"), "foo");
            assert.equal(db.getKeys("test-remove").equals(['sample']), true);
            db.removeValueForKey("test-remove", "sample", undefined);
            assert.equal(db.getKeys("test-remove").equals([]), true);

            db.setValueForKey("test-remove", "sample", "foo", function() {
                db.valueForKey("test-remove", "sample", function(err, stored) {
                    assert.equal(err, undefined);
                    assert.equal(stored, "foo");
                    assert.equal(db.getKeys("test-remove").equals(['sample']), true);
                    db.removeValueForKey("test-remove", "sample", function() {
                        assert.equal(db.getKeys("test-remove").equals([]), true);
                        done();
                    });
                });
            });
        });
    });
})



