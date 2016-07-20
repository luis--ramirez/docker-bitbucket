define('bitbucket/internal/bbui/analytics/analytics', ['module', 'exports', '../javascript-errors/javascript-errors'], function (module, exports, _javascriptErrors) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var Analytics = function () {
        function Analytics() {
            babelHelpers.classCallCheck(this, Analytics);
        }

        babelHelpers.createClass(Analytics, [{
            key: 'trigger',
            value: function trigger(eventName, eventAttributes) {
                throw new _javascriptErrors.NotImplementedError();
            }
        }]);
        return Analytics;
    }();

    exports.default = Analytics;
    module.exports = exports['default'];
});