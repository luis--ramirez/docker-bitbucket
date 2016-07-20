define('bitbucket/internal/bbui/utils/Soy', ['module', 'exports', 'react', 'lodash'], function (module, exports, _react, _lodash) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var propTypes = {
        template: _react.PropTypes.string.isRequired
    };

    var Soy = function (_Component) {
        babelHelpers.inherits(Soy, _Component);

        function Soy() {
            babelHelpers.classCallCheck(this, Soy);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Soy).apply(this, arguments));
        }

        babelHelpers.createClass(Soy, [{
            key: 'shouldComponentUpdate',
            value: function shouldComponentUpdate(nextProps) {
                return !(0, _lodash.isEqual)(this.props, nextProps);
            }
        }, {
            key: 'render',
            value: function render() {
                var soy = {
                    __html: this.props.template(this.props)
                };
                return _react2.default.createElement('div', { className: 'soy-container', dangerouslySetInnerHTML: soy });
            }
        }]);
        return Soy;
    }(_react.Component);

    exports.default = Soy;


    Soy.propTypes = propTypes;
    module.exports = exports['default'];
});