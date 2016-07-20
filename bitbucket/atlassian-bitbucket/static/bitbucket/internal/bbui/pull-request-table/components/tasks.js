define('bitbucket/internal/bbui/pull-request-table/components/tasks', ['module', 'exports', 'react', '../../aui-react/icon', './count-cell'], function (module, exports, _react, _icon, _countCell) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _icon2 = babelHelpers.interopRequireDefault(_icon);

    var _countCell2 = babelHelpers.interopRequireDefault(_countCell);

    var propTypes = {
        pullRequest: _react.PropTypes.object.isRequired
    };

    var Tasks = function (_Component) {
        babelHelpers.inherits(Tasks, _Component);

        function Tasks() {
            babelHelpers.classCallCheck(this, Tasks);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Tasks).apply(this, arguments));
        }

        babelHelpers.createClass(Tasks, [{
            key: 'shouldComponentUpdate',
            value: function shouldComponentUpdate(newProps) {
                return this.props.pullRequest.task_count !== newProps.pullRequest.task_count;
            }
        }, {
            key: 'render',
            value: function render() {
                var pullRequest = this.props.pullRequest;
                return _react2.default.createElement(_countCell2.default, {
                    count: pullRequest.task_count,
                    tooltip: AJS.I18n.getText('bitbucket.web.tasks.openTaskCount', pullRequest.task_count),
                    className: 'tasks',
                    icon: _react2.default.createElement(
                        _icon2.default,
                        { size: 'small', icon: 'editor-task' },
                        AJS.I18n.getText('bitbucket.web.tasks.openTask.label')
                    )
                });
            }
        }]);
        return Tasks;
    }(_react.Component);

    Tasks.Header = _countCell2.default.Header;
    Tasks.propTypes = propTypes;

    exports.default = Tasks;
    module.exports = exports['default'];
});