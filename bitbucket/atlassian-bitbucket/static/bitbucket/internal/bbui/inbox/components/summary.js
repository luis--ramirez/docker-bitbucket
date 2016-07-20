define('bitbucket/internal/bbui/inbox/components/summary', ['module', 'exports', 'react', 'bitbucket/internal/impl/urls', '../../aui-react/icon'], function (module, exports, _react, _urls, _icon) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _urls2 = babelHelpers.interopRequireDefault(_urls);

    var _icon2 = babelHelpers.interopRequireDefault(_icon);

    var Summary = function (_Component) {
        babelHelpers.inherits(Summary, _Component);

        function Summary() {
            babelHelpers.classCallCheck(this, Summary);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Summary).apply(this, arguments));
        }

        babelHelpers.createClass(Summary, [{
            key: 'shouldComponentUpdate',
            value: function shouldComponentUpdate(newProps) {
                return this.props.pullRequest.id !== newProps.pullRequest.id || this.props.pullRequest.title !== newProps.pullRequest.title || this.props.pullRequest.to_ref.id !== newProps.pullRequest.to_ref.id || this.props.pullRequest.updated_date !== newProps.pullRequest.updated_date;
            }
        }, {
            key: 'render',
            value: function render() {
                var pullRequest = this.props.pullRequest;
                return _react2.default.createElement(
                    'td',
                    { className: 'summary' },
                    _react2.default.createElement(
                        'div',
                        { className: 'title-and-target-branch' },
                        _react2.default.createElement(
                            'a',
                            { className: 'pull-request-title',
                                title: pullRequest.title,
                                href: _urls2.default.inboxPullRequest(pullRequest.to_ref.repository.project, pullRequest.to_ref.repository, pullRequest)
                            },
                            pullRequest.title
                        )
                    ),
                    _react2.default.createElement(
                        'div',
                        { className: 'pull-request-project-repo' },
                        _react2.default.createElement(
                            'span',
                            { className: 'project-name' },
                            pullRequest.to_ref.repository.project.name
                        ),
                        _react2.default.createElement(_icon2.default, { size: 'small', icon: 'collapsed' }),
                        _react2.default.createElement(
                            'span',
                            { className: 'repo-name' },
                            pullRequest.to_ref.repository.name
                        )
                    )
                );
            }
        }], [{
            key: 'propTypes',
            get: function get() {
                return {
                    pullRequest: _react.PropTypes.object.isRequired
                };
            }
        }]);
        return Summary;
    }(_react.Component);

    Summary.Header = function () {
        return _react2.default.createElement(
            'th',
            { className: 'summary', scope: 'col' },
            AJS.I18n.getText('bitbucket.pull.request.table.title.summary')
        );
    };

    exports.default = Summary;
    module.exports = exports['default'];
});