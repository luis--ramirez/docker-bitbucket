define('bitbucket/internal/bbui/javascript-errors/not-implemented-error', ['module', 'exports'], function (module, exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var NotImplementedError = function (_Error) {
        babelHelpers.inherits(NotImplementedError, _Error);

        function NotImplementedError(message) {
            babelHelpers.classCallCheck(this, NotImplementedError);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(NotImplementedError).call(this, message));

            _this.name = 'NotImplementedError';
            _this.message = message || 'This method has not been implemented';
            return _this;
        }

        return NotImplementedError;
    }(Error);

    exports.default = NotImplementedError;
    module.exports = exports['default'];
});