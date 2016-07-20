(function(window) {
    /* global require: true, define: true */

    'use strict';

    // Almond claims to be AMD compatible, but isn't.
    delete define.amd;

    var oldRequire = require;
    var logged = false;
    require = function(modules, cb) {
        if (typeof modules === 'string' && typeof cb === 'function') {
            if (!logged) {
                logged = true;
                console.log('WARN: require(string, function) has been deprecated in 2.11 and will throw an error' +
                    ' in 4.0. Use an array of dependencies - require(Array<string> function). (requiring '  + modules + ')');
            }
            modules = [modules];
        }
        //explicitly disallow use of Almond internal params.
        if (cb && typeof cb !== 'function') {
            throw new Error('Callback was not a function');
        }
        return oldRequire.call(window, modules, cb);
    };

    window.requireLite = require; // Used for testing
    window.defineLite = define; // Used for testing
})(window || this);
