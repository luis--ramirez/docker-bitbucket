define('bitbucket/internal/bbui/mirroring-admin/mirror-view/mirror-view', ['module', 'exports', 'aui', 'aui/flag', 'jquery', 'lodash', 'bitbucket/internal/impl/request', '../../widget/widget', '../nav-builder'], function (module, exports, _aui, _flag, _jquery, _lodash, _request, _widget, _navBuilder) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _aui2 = babelHelpers.interopRequireDefault(_aui);

    var _flag2 = babelHelpers.interopRequireDefault(_flag);

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _request2 = babelHelpers.interopRequireDefault(_request);

    var _widget2 = babelHelpers.interopRequireDefault(_widget);

    var _navBuilder2 = babelHelpers.interopRequireDefault(_navBuilder);

    /**
     * @typedef {Object} Mirror
     * @property {string} name      - the Mirror's name
     * @property {string} baseUrl   - the Mirror's base URL
     */

    /**
     * @typedef {Object} ViewData
     * @property {Mirror} item - the Mirror the view should display
     */

    var LOADING_SPINNER_TIMEOUT = 500;

    var MirrorView = function (_Widget) {
        babelHelpers.inherits(MirrorView, _Widget);


        /**
         * @param {jQuery| HTMLElement} el      - the container element for this component
         * @param {ViewData}            options - the Mirror this component shows information for
         */

        function MirrorView(el, options) {
            babelHelpers.classCallCheck(this, MirrorView);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(MirrorView).call(this, options));

            _this.$el = (0, _jquery2.default)(el);
            _this.$el.html(bitbucket.internal.component.mirroringAdmin.mirrorView.main(options));
            _this.$panel = _this.$el.find("#mirror-details-panel");
            _this.mirror = _this.options.item;
            _this.init();
            return _this;
        }

        babelHelpers.createClass(MirrorView, [{
            key: 'destroy',
            value: function destroy() {
                babelHelpers.get(Object.getPrototypeOf(MirrorView.prototype), 'destroy', this).call(this);
                if (this.loadingPanelRequest) {
                    this.loadingPanelRequest.abort();
                    delete this.loadingPanelRequest;
                }
                this._cancelLoadingTimer();
                this.$el.empty();
                delete this.$el;
            }
        }, {
            key: 'init',
            value: function init() {
                var _this2 = this;

                (0, _jquery2.default)('#mirror-remove-button').on('click', this.showRemoveMirrorDialog);
                this.$panel.on('click', "#mirror-reload", function (e) {
                    e.preventDefault();
                    _this2.showMirrorPanel();
                });
                this.showMirrorPanel();
            }
        }, {
            key: 'showRemoveMirrorDialog',
            value: function showRemoveMirrorDialog() {
                var _this3 = this;

                var $dialogEl = (0, _jquery2.default)(bitbucket.internal.component.mirroringAdmin.mirrorView.deleteDialog({
                    mirrorName: this.mirror.name
                }));
                this.$el.append($dialogEl);

                var dialog = _aui2.default.dialog2('#delete-mirror-dialog');

                dialog.on('hide', function () {
                    $dialogEl.remove();
                });

                $dialogEl.find('#dialog-delete-button').click(function () {
                    _this3.removeMirror();
                    dialog.hide();
                });

                $dialogEl.find('#dialog-cancel-button').click(function () {
                    return dialog.hide();
                });

                dialog.show();
            }
        }, {
            key: 'showMirrorPanel',
            value: function showMirrorPanel() {
                var _this4 = this;

                this._delayShowLoadingSpinner();
                this.loadingPanelRequest = _request2.default.rest({
                    type: 'GET',
                    dataType: 'html',
                    url: _navBuilder2.default.rest().mirroring().panel(this.mirror.id).build(),
                    statusCode: {
                        '*': false
                    }
                }).always(function () {
                    _this4._hideLoadingSpinner();
                    delete _this4.loadingPanelRequest;
                }).done(function (response) {
                    _this4.$panel.html(response);
                }).fail(function (xhr, status) {
                    if (status !== 'abort') {
                        _this4._renderErrorView();
                    }
                });
            }
        }, {
            key: 'removeMirror',
            value: function removeMirror() {
                var _this5 = this;

                MirrorView._showRemoveSpinner();
                _request2.default.rest({
                    type: 'DELETE',
                    url: _navBuilder2.default.rest().mirroring().path('mirrorServers', this.mirror.id).build(),
                    statusCode: {
                        409: false
                    }
                }).done(function (response) {
                    _this5._removeMirrorSuccessful();

                    /**
                     * A mirror removed event object.
                     * @typedef {Object} MirrorRemoved
                     * @property {string}   id            - The ID of the mirror that was removed
                     * @property {string}   type          - The type to remove. Always 'mirror' here.
                     * @property {JSON}     responseJSON  - The JSON returned by the REST request.
                     */
                    _this5.trigger('mirror-removed', {
                        id: _this5.mirror.id,
                        type: 'mirror',
                        responseJSON: response
                    });
                }).fail(function (response) {
                    var errors = _lodash2.default.get(response, 'responseJSON.errors');
                    if (errors) {
                        // one of our REST errors
                        return _this5._removeMirrorFailed(errors);
                    }
                    throw response; // some other error; Bubble it up.
                }).always(MirrorView._stopRemoveSpinner);
            }
        }, {
            key: '_removeMirrorFailed',
            value: function _removeMirrorFailed(errors) {
                (0, _flag2.default)({
                    type: 'error',
                    title: _aui2.default.I18n.getText('bitbucket.component.mirroring.admin.mirror.remove.failure', this.mirror.name),
                    body: errors.map(function (error) {
                        return _aui2.default.escapeHtml(error.message);
                    }).join(',')
                });
            }
        }, {
            key: '_removeMirrorSuccessful',
            value: function _removeMirrorSuccessful() {
                (0, _flag2.default)({
                    type: 'success',
                    title: _aui2.default.I18n.getText('bitbucket.component.mirroring.admin.mirror.remove.success', this.mirror.name),
                    persistent: false,
                    close: 'auto',
                    body: ''
                });
            }
        }, {
            key: '_renderErrorView',
            value: function _renderErrorView() {
                this.$panel.html(bitbucket.internal.component.mirroringAdmin.mirrorView.mirrorConnectionError());
            }
        }, {
            key: '_delayShowLoadingSpinner',
            value: function _delayShowLoadingSpinner() {
                var _this6 = this;

                this.loadingSpinnerTimer = window.setTimeout(function () {
                    _this6.$panel.html(bitbucket.internal.component.mirroringAdmin.mirrorView.loading());
                    _this6.$panel.find('#mirror-loading').spin('large');
                    delete _this6.loadingSpinnerTimer;
                }, LOADING_SPINNER_TIMEOUT);
            }
        }, {
            key: '_hideLoadingSpinner',
            value: function _hideLoadingSpinner() {
                this.$panel.find('#mirror-loading').spinStop();
                this._cancelLoadingTimer();
            }
        }, {
            key: '_cancelLoadingTimer',
            value: function _cancelLoadingTimer() {
                if (_lodash2.default.isNumber(this.loadingSpinnerTimer)) {
                    window.clearTimeout(this.loadingSpinnerTimer);
                    delete this.loadingSpinnerTimer;
                }
            }
        }], [{
            key: '_showRemoveSpinner',
            value: function _showRemoveSpinner() {
                (0, _jquery2.default)('#mirror-remove-button').addClass('hidden');
                (0, _jquery2.default)('#mirror-remove-button-spinner').removeClass('hidden').spin();
            }
        }, {
            key: '_stopRemoveSpinner',
            value: function _stopRemoveSpinner() {
                (0, _jquery2.default)('#mirror-remove-button').removeClass('hidden');
                (0, _jquery2.default)('#mirror-remove-button-spinner').addClass('hidden').spinStop();
            }
        }]);
        return MirrorView;
    }(_widget2.default);

    exports.default = MirrorView;
    module.exports = exports['default'];
});