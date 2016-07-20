define('bitbucket/internal/bbui/pull-request-header/components/merge-help-dialog', ['module', 'exports', 'react', 'aui', '../../aui-react/component', '../../models/models', './merge-instructions'], function (module, exports, _react, _aui, _component, _models, _mergeInstructions) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _aui2 = babelHelpers.interopRequireDefault(_aui);

    var _component2 = babelHelpers.interopRequireDefault(_component);

    var _mergeInstructions2 = babelHelpers.interopRequireDefault(_mergeInstructions);

    var MergeHelpDialog = function (_Component) {
        babelHelpers.inherits(MergeHelpDialog, _Component);

        function MergeHelpDialog() {
            babelHelpers.classCallCheck(this, MergeHelpDialog);
            return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(MergeHelpDialog).apply(this, arguments));
        }

        babelHelpers.createClass(MergeHelpDialog, [{
            key: 'componentDidMount',
            value: function componentDidMount() {
                var _this2 = this;

                this.dialog = _aui2.default.dialog2(document.querySelector('#' + this.props.id));
                this.dialog.on('hide', function () {
                    _this2.dialog.$el.remove();
                    _this2.props.onHide();
                });
                this.dialog.$el.find('#merge-help-dialog-close-button').on('click', function () {
                    return _this2.dialog.hide();
                });
                this.dialog.show();
            }
        }, {
            key: 'render',
            value: function render() {
                var props = this.props;
                var title = _aui2.default.I18n.getText('bitbucket.component.pull.request.merge.conflict.title');
                if (this.props.isAutoMergeConflict) {
                    title = _aui2.default.I18n.getText('bitbucket.component.pull.request.automerge.conflict.title');
                }
                var closeButtonText = _aui2.default.I18n.getText('bitbucket.component.web.button.close');
                var markup = '\n                <section role="dialog" id="' + props.id + '" aria-hidden="true" class="aui-layer aui-dialog2 aui-dialog2-large">\n                    <header class="aui-dialog2-header">\n                        <h2 class="aui-dialog2-header-main">' + title + '</h2>\n                        <a class="aui-dialog2-header-close">\n                            <span class="aui-icon aui-icon-small aui-iconfont-close-dialog">' + closeButtonText + '</span>\n                        </a>\n                    </header>\n                    <div class="aui-dialog2-content">\n                        <div class="merge-help"></div>\n                    </div>\n                    <footer class="aui-dialog2-footer">\n                        <div class="aui-dialog2-footer-actions">\n                            <button id="merge-help-dialog-close-button" class="aui-button aui-button-link">' + closeButtonText + '</button>\n                        </div>\n                    </footer>\n                </section>\n        ';
                return _react2.default.createElement(
                    _component2.default,
                    {
                        id: props.id,
                        markup: markup,
                        containerSelector: '#' + props.id + ' .aui-dialog2-content .merge-help'
                    },
                    _react2.default.createElement(_mergeInstructions2.default, {
                        pullRequest: this.props.pullRequest,
                        stability: this.props.stability,
                        isAutoMergeConflict: this.props.isAutoMergeConflict
                    })
                );
            }
        }], [{
            key: 'propTypes',
            get: function get() {
                return {
                    id: _react.PropTypes.string.isRequired,
                    onHide: _react.PropTypes.func.isRequired,
                    stability: _react.PropTypes.oneOf(Object.keys(_models.BranchStability).map(function (k) {
                        return _models.BranchStability[k];
                    })),
                    isAutoMergeConflict: _react.PropTypes.bool,
                    pullRequest: _react.PropTypes.object.isRequired
                };
            }
        }]);
        return MergeHelpDialog;
    }(_react.Component);

    exports.default = MergeHelpDialog;
    module.exports = exports['default'];
});