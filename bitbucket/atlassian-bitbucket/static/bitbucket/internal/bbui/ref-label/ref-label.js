define('bitbucket/internal/bbui/ref-label/ref-label', ['module', 'exports', 'react', '../aui-react/avatar'], function (module, exports, _react, _avatar) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var propTypes = {
        scmRef: _react2.default.PropTypes.any.isRequired,
        repository: _react2.default.PropTypes.any,
        title: _react2.default.PropTypes.string,
        accessibilityText: _react2.default.PropTypes.string
    };

    var RefLabel = function RefLabel(props) {
        var ref = props.scmRef;
        var repo = props.repository;
        var accessibilityText = props.accessibilityText || AJS.I18n.getText('refLabel.branch.ariaLabel', ref.display_id);

        return _react2.default.createElement(
            'span',
            { className: 'ref-label', title: props.title },
            repo && _react2.default.createElement(
                'span',
                { className: 'repository' },
                repo.project && _react2.default.createElement(_avatar.ProjectAvatar, { size: 'xsmall', project: repo.project }),
                _react2.default.createElement(
                    'span',
                    { className: 'name' },
                    repo.name
                )
            ),
            _react2.default.createElement(
                'span',
                { className: "ref " + (ref.type || 'branch') },
                _react2.default.createElement(
                    'span',
                    { className: 'name', 'aria-label': accessibilityText },
                    ref.display_id
                )
            )
        );
    };

    RefLabel.propTypes = propTypes;

    exports.default = RefLabel;
    module.exports = exports['default'];
});