define('bitbucket/internal/bbui/mirroring-admin/request-view/request-view', ['module', 'exports', 'aui', 'aui/flag', 'jquery', 'lodash', 'bitbucket/internal/impl/request', '../../widget/widget', '../nav-builder'], function (module, exports, _aui, _flag, _jquery, _lodash, _request, _widget, _navBuilder) {
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
     * Enum for mirror modes.
     * @readonly
     * @enum {string}
     */
    var MirrorMode = {
        ALL: 'all_projects',
        SELECTED: 'selected_projects'
    };

    /**
     * Enum for request resolutions.
     * @readonly
     * @enum {string}
     */
    var Resolutions = {
        ACCEPT: 'accept',
        REJECT: 'reject'
    };

    var RequestView = function (_Widget) {
        babelHelpers.inherits(RequestView, _Widget);


        /**
         * The request view shows the approve/decline options for a mirror requesting approval.
         * @param {jQuery|HTMLElement} el - the container element that hosts this control
         * @param {object} options - Options for this RequestView
         * @param {MirrorRequest} options.item - The MirrorRequest for this RequestView
         */

        function RequestView(el, options) {
            babelHelpers.classCallCheck(this, RequestView);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RequestView).call(this, options));

            _this.$el = (0, _jquery2.default)(el);
            _this.$el.html(bitbucket.internal.component.mirroringAdmin.requestView.main(options));
            _this.item = options.item;
            _this.$el.find('#approve-mirror-button').on('click', _this.approveMirrorButtonClicked);
            _this.$el.find('#decline-mirror-button').on('click', _this.declineMirrorButtonClicked);
            return _this;
        }

        babelHelpers.createClass(RequestView, [{
            key: 'destroy',
            value: function destroy() {
                babelHelpers.get(Object.getPrototypeOf(RequestView.prototype), 'destroy', this).call(this);
                this.$el.empty();
                this.$el = null;
                this.item = null;
            }
        }, {
            key: 'approveMirrorButtonClicked',
            value: function approveMirrorButtonClicked(e) {
                //Need to prevent the form from submitting and reloading the page.
                e.preventDefault();
                this.resolveRequest(Resolutions.ACCEPT, this.$el.find('#all-projects-radio').is(':checked') ? MirrorMode.ALL : MirrorMode.SELECTED);
            }
        }, {
            key: 'confirmDeclineMirror',
            value: function confirmDeclineMirror() {
                var _this2 = this;

                var $dialogEl = (0, _jquery2.default)(bitbucket.internal.component.mirroringAdmin.requestView.declineDialog({
                    mirrorName: this.item.mirrorName
                }));
                this.$el.append($dialogEl);

                var dialog = _aui2.default.dialog2('#decline-mirror-request-dialog');

                dialog.on('hide', function () {
                    $dialogEl.remove();
                });

                $dialogEl.find('#dialog-decline-button').click(function () {
                    _this2.resolveRequest(Resolutions.REJECT);
                    dialog.hide();
                });

                $dialogEl.find('#dialog-cancel-button').click(function () {
                    return dialog.hide();
                });

                dialog.show();
            }
        }, {
            key: 'declineMirrorButtonClicked',
            value: function declineMirrorButtonClicked(e) {
                //Need to prevent the form from submitting and reloading the page.
                e.preventDefault();
                this.confirmDeclineMirror();
            }
        }, {
            key: 'resolveRequest',
            value: function resolveRequest(resolution, mirroringMode) {
                var _this3 = this;

                var id = this.item.id;
                this._showSpinner();
                _request2.default.rest({
                    type: 'POST',
                    url: _navBuilder2.default.rest().mirroring().path('requests', id, resolution).params(mirroringMode ? { mirroringMode: mirroringMode } : null).build(),
                    statusCode: {
                        '*': false
                    }
                }).done(function (response) {
                    _this3._mirrorRequestActionSuccess(resolution);

                    /**
                     * A request resolved event object.
                     * @typedef {Object} RequestResolvedObject
                     * @property {string}   id              - The ID of the request that was resolved
                     * @property {string}   type            - The type of item that was resolved.
                     * @property {string}   resolution      - The resolution. Can be accepted or rejected.
                     * @property {JSON}     responseJSON    - The JSON returned by the REST request.
                     */
                    _this3.trigger('request-resolved', {
                        id: id,
                        type: 'request',
                        resolution: resolution,
                        responseJSON: response
                    });
                }).fail(function (response) {
                    var errors = _lodash2.default.get(response, 'responseJSON.errors');
                    if (errors) {
                        // one of our REST errors
                        return _this3._mirrorRequestActionFailed(resolution, errors);
                    }
                    throw response; // some other error; Bubble it up.
                }).always(this._stopSpinner);
            }
        }, {
            key: '_mirrorRequestActionFailed',
            value: function _mirrorRequestActionFailed(resolution, errors) {
                var mirrorName = this.item.mirrorName;
                (0, _flag2.default)({
                    type: 'error',
                    title: resolution === Resolutions.ACCEPT ? _aui2.default.I18n.getText('bitbucket.component.mirroring.admin.request.view.flags.request.approve.failure', mirrorName) : _aui2.default.I18n.getText('bitbucket.component.mirroring.admin.request.view.flags.request.reject.failure', mirrorName),
                    body: errors.map(function (error) {
                        return _aui2.default.escapeHtml(error.message);
                    }).join(',')
                });
            }
        }, {
            key: '_mirrorRequestActionSuccess',
            value: function _mirrorRequestActionSuccess(resolution) {
                var mirrorName = this.item.mirrorName;
                (0, _flag2.default)({
                    type: 'success',
                    title: resolution === Resolutions.ACCEPT ? _aui2.default.I18n.getText('bitbucket.component.mirroring.admin.request.view.flags.request.approve.success', mirrorName) : _aui2.default.I18n.getText('bitbucket.component.mirroring.admin.request.view.flags.request.reject.success', mirrorName),
                    persistent: false,
                    close: 'auto',
                    body: ''
                });
            }
        }, {
            key: '_showSpinner',
            value: function _showSpinner() {
                _aui2.default.$('#mirror-action-button-spinner').spin();
            }
        }, {
            key: '_stopSpinner',
            value: function _stopSpinner() {
                _aui2.default.$('#mirror-action-button-spinner').spinStop();
            }
        }]);
        return RequestView;
    }(_widget2.default);

    exports.default = RequestView;
    module.exports = exports['default'];
});