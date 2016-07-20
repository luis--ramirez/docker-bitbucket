define('bitbucket/internal/bbui/reviewer-status/reviewer-status', ['module', 'exports', 'aui', 'classnames', 'lodash', 'react', '../models/models'], function (module, exports, _aui, _classnames, _lodash, _react, _models) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _aui2 = babelHelpers.interopRequireDefault(_aui);

    var _classnames2 = babelHelpers.interopRequireDefault(_classnames);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var propTypes = {
        currentUserAsReviewer: _react.PropTypes.object,
        onStatusClick: _react.PropTypes.func.isRequired,
        status: _react.PropTypes.oneOf(_lodash2.default.values(_models.ApprovalState))
    };

    var titles = {
        'approve': _aui2.default.I18n.getText('bitbucket.component.reviewer.status.approve'),
        'approve-deselect': _aui2.default.I18n.getText('bitbucket.component.reviewer.status.approve.deselect'),
        'needs-work': _aui2.default.I18n.getText('bitbucket.component.reviewer.status.needs.work'),
        'needs-work-deselect': _aui2.default.I18n.getText('bitbucket.component.reviewer.status.needs.work.deselect')
    };

    var titlesWithLineBreaks = {
        'approve': _aui2.default.I18n.getText('bitbucket.component.reviewer.status.approve.html'),
        'approve-deselect': _aui2.default.I18n.getText('bitbucket.component.reviewer.status.approve.deselect.html'),
        'needs-work': _aui2.default.I18n.getText('bitbucket.component.reviewer.status.needs.work.html'),
        'needs-work-deselect': _aui2.default.I18n.getText('bitbucket.component.reviewer.status.needs.work.deselect.html')
    };

    var ReviewerStatus = function ReviewerStatus(props) {
        function makeStatus(status, cssClass) {
            var isPressed = props.status === status;
            return _react2.default.createElement(
                'button',
                { className: "aui-button " + cssClass, 'aria-pressed': isPressed,
                    title: titlesWithLineBreaks[cssClass + (isPressed ? '-deselect' : '')],
                    onClick: function onClick() {
                        return props.onStatusClick({ newStatus: isPressed ? _models.ApprovalState.UNAPPROVED : status });
                    },
                    ref: function ref(el) {
                        return _aui2.default.$(el).tooltip({
                            html: true
                        });
                    }
                },
                _react2.default.createElement(
                    'span',
                    null,
                    titles[cssClass + (isPressed ? '-deselect' : '')]
                )
            );
        }

        return _react2.default.createElement(
            'div',
            { className: (0, _classnames2.default)('aui-buttons', 'reviewer-status-selector', { reviewing: props.currentUserAsReviewer }), 'data-status': props.status },
            makeStatus(_models.ApprovalState.NEEDS_WORK, 'needs-work'),
            makeStatus(_models.ApprovalState.APPROVED, 'approve')
        );
    };
    ReviewerStatus.propTypes = propTypes;

    exports.default = ReviewerStatus;
    module.exports = exports['default'];
});