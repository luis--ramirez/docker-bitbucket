define('bitbucket/internal/bbui/pull-request-list-table/components/summary', ['module', 'exports', 'react', 'bitbucket/internal/impl/urls', 'bitbucket/internal/util/time', '../../aui-react/icon', '../../ref-label/ref-label'], function (module, exports, _react, _urls, _time, _icon, _refLabel) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _urls2 = babelHelpers.interopRequireDefault(_urls);

    var _icon2 = babelHelpers.interopRequireDefault(_icon);

    var _refLabel2 = babelHelpers.interopRequireDefault(_refLabel);

    var propTypes = {
        pullRequest: _react.PropTypes.object.isRequired
    };

    var customMapping = {
        aMomentAgo: function aMomentAgo() {
            return AJS.I18n.getText('bitbucket.pull.request.updated.date.format.a.moment.ago');
        },
        oneMinuteAgo: function oneMinuteAgo() {
            return AJS.I18n.getText('bitbucket.pull.request.updated.date.format.one.minute.ago');
        },
        xMinutesAgo: function xMinutesAgo(param) {
            return AJS.I18n.getText('bitbucket.pull.request.updated.date.format.x.minutes.ago', param);
        },
        oneHourAgo: function oneHourAgo() {
            return AJS.I18n.getText('bitbucket.pull.request.updated.date.format.one.hour.ago');
        },
        xHoursAgo: function xHoursAgo(param) {
            return AJS.I18n.getText('bitbucket.pull.request.updated.date.format.x.hours.ago', param);
        },
        oneDayAgo: function oneDayAgo() {
            return AJS.I18n.getText('bitbucket.pull.request.updated.date.format.one.day.ago');
        },
        xDaysAgo: function xDaysAgo(param) {
            return AJS.I18n.getText('bitbucket.pull.request.updated.date.format.x.days.ago', param);
        },
        oneWeekAgo: function oneWeekAgo() {
            return AJS.I18n.getText('bitbucket.pull.request.updated.date.format.one.week.ago');
        },
        defaultType: function defaultType(param) {
            return AJS.I18n.getText('bitbucket.pull.request.updated.date.format.absolute', param);
        }
    };

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
                var props = this.props;
                var pullRequest = props.pullRequest;

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
                                href: _urls2.default.pullRequest(pullRequest)
                            },
                            pullRequest.title
                        ),
                        _react2.default.createElement(_icon2.default, { size: 'small', icon: 'devtools-arrow-right' }),
                        _react2.default.createElement(
                            'span',
                            { className: 'pull-request-target-branch' },
                            _react2.default.createElement(_refLabel2.default, { scmRef: pullRequest.to_ref })
                        )
                    ),
                    _react2.default.createElement(
                        'div',
                        { className: 'pr-author-number-and-timestamp' },
                        _react2.default.createElement(
                            'span',
                            null,
                            pullRequest.author.user.display_name,
                            ' - #',
                            pullRequest.id,
                            ', '
                        ),
                        _react2.default.createElement(
                            'time',
                            {
                                title: (0, _time.format)(pullRequest.updated_date, 'full'),
                                dateTime: (0, _time.format)(pullRequest.updated_date, 'timestamp')
                            },
                            (0, _time.format)(pullRequest.updated_date, 'shortAge', customMapping)
                        )
                    )
                );
            }
        }]);
        return Summary;
    }(_react.Component);

    var headerPropTypes = {
        colSpan: _react.PropTypes.number
    };

    var Header = function Header(props) {
        return _react2.default.createElement(
            'th',
            { className: 'summary', scope: 'col', colSpan: props.colSpan },
            AJS.I18n.getText('bitbucket.pull.request.table.title.summary')
        );
    };

    Header.propTypes = headerPropTypes;
    Summary.propTypes = propTypes;

    Summary.Header = Header;

    exports.default = Summary;
    module.exports = exports['default'];
});