define('bitbucket/internal/bbui/filter-bar/components/filter', ['module', 'exports', 'react', '../../javascript-errors/javascript-errors'], function (module, exports, _react, _javascriptErrors) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var Filter = function (_Component) {
        babelHelpers.inherits(Filter, _Component);

        function Filter() {
            babelHelpers.classCallCheck(this, Filter);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Filter).apply(this, arguments));
        }

        babelHelpers.createClass(Filter, [{
            key: 'value',
            value: function value() {
                throw new _javascriptErrors.NotImplementedError();
            }
        }, {
            key: 'domValue',
            value: function domValue() {
                throw new _javascriptErrors.NotImplementedError();
            }
        }, {
            key: 'reset',
            value: function reset() {
                throw new _javascriptErrors.NotImplementedError();
            }
        }]);
        return Filter;
    }(_react.Component);

    exports.default = Filter;
    module.exports = exports['default'];
});