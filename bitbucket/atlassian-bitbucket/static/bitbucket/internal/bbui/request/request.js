define('bitbucket/internal/bbui/request/request', ['module', 'exports', '../javascript-errors/javascript-errors'], function (module, exports, _javascriptErrors) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _javascriptErrors2 = babelHelpers.interopRequireDefault(_javascriptErrors);

    exports.default = {

        /**
         * This is basically a shim to allow Bitbucket Cloud and Server to use their own AJAX request implementations.
         * @interface
         * @param {Object} options - the options for the REST call
         * @returns {Promise}
         */

        rest: function rest(options) {
            // eslint-disable-line no-unused-vars
            throw new _javascriptErrors2.default.NotImplementedError();
        }
    };
    module.exports = exports['default'];
});