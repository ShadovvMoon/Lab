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

var db_module = module.exports;
var defines   = require("./defines");

//Internal variables.
db_module._root_database = require('./ministore')('database');

/**
 * Adds a database to the _databases dictionary
 * @param database - the name of the database to load
 * @private
 */
db_module._load_db = function (database) {
    if (typeof db_module._databases == 'undefined')
        db_module._databases = {};

    if ((!(database in db_module._databases)) || (typeof db_module._databases[database] == 'undefined')) {
        defines.verbose("Loading database " + database);
        db_module._databases[database] = db_module._root_database(database);
    }
    return;
};

/**
 * Saves a database
 * @param database - the name of the database to save
 * @private
 */
db_module._save_db = function (database, callback) {
    if (typeof db_module._databases[database] !== 'undefined') {
        defines.debug("Saving " + database);
        db_module._databases[database].save(callback);
        return true;
    }
    if (typeof callback !== 'undefined') {
        return callback(false);
    }
    return false;
};

/**
 * Returns the value for the specific key
 * @param database - the database
 * @param key - the key to get the value from
 * @param callback - an optional asyncronous callback
 * @returns {*} - the value stored against the key
 */
db_module.valueForKey = function (database, key, callback) {
    db_module._load_db(database);
    if (typeof db_module._databases[database] !== 'undefined')
    {
        if (typeof callback !== 'undefined')
        {
            db_module._databases[database].get(key, function(callback){
                return function(err, obj){
                    if (err) {
                        return callback(err, undefined);
                    }
                    var copied = JSON.parse(JSON.stringify(obj));
                    defines.debug("Retrieving " + JSON.stringify(copied) + " from " + JSON.stringify(key) + " in " + database);
                    callback(err, copied);
                };
            }(callback));
            return;
        }
        else
        {
            var obj = db_module._databases[database].get(key);
            if (typeof obj !== 'undefined')
            {
                var ret = JSON.parse(JSON.stringify(obj));
                defines.debug("Retrieving " + JSON.stringify(ret) + " from " + JSON.stringify(key) + " in " + database);
                return ret;
            }
            defines.debug("Retrieving " + "undefined" + " from " + JSON.stringify(key) + " in " + database);
            return undefined;
        }
    }
    if (typeof callback !== 'undefined')
        callback(undefined);
    defines.debug("Retrieving " + "undefined" + " from " + JSON.stringify(key) + " in undefined " + database);
    return undefined;
};

/**
 * Returns the keys for a database
 * @param database - the database
 * @returns [] - list of keys
 */
db_module.getKeys = function (database)
{
    db_module._load_db(database);
    if (typeof db_module._databases[database] !== 'undefined')
        return db_module._databases[database].list();
    return [];
}

/**
 * Associates a value with a key in a database.
 * @param database - the database
 * @param key - the key to associate the value with
 * @param value - the value
 * @param callback - an optional asyncronous callback
 */
db_module.setValueForKey = function (database, key, value, callback) {
    db_module._load_db(database);
    if (typeof db_module._databases[database] !== 'undefined')
    {
        defines.debug("Setting " + JSON.stringify(key) + " to " + JSON.stringify(value) + " in " + database);
        db_module._databases[database].set(key, value);
        db_module._save_db(callback);
    }
    if (typeof callback !== 'undefined')
        callback(false);
    return false;
};

/**
 * Deletes the value associated with a particular key
 * @param database - the database
 * @param key - the key to associate the value with
 * @param callback - an optional asyncronous callback
 * @returns {*}
 */
db_module.removeValueForKey = function(database, key, callback)
{
    db_module._load_db(database);
    if (typeof db_module._databases[database] !== 'undefined') {
        defines.debug("Deleting " + key + " from " + database);
        if (typeof callback !== 'undefined') {
            return db_module._databases[database].remove(key, function() {
                return db_module._save_db(database, callback);
            });
        }

        db_module._databases[database].remove(key);
        db_module._save_db(database);
        return true;
    }

    defines.debug("Cannot remove value for " + key + " because " + database + " is not loaded.");
    if (typeof callback !== 'undefined') {
        return callback(false);
    }
    return false;
}

