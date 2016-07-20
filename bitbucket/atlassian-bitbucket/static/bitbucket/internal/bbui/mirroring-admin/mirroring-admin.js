define('bitbucket/internal/bbui/mirroring-admin/mirroring-admin', ['module', 'exports', 'aui', 'jquery', 'lodash', 'bitbucket/internal/impl/request', 'bitbucket/internal/impl/urls', '../list-and-detail-view/list-and-detail-view', '../widget/widget', './mirror-view/mirror-view', './nav-builder', './request-view/request-view'], function (module, exports, _aui, _jquery, _lodash, _request, _urls, _listAndDetailView, _widget, _mirrorView, _navBuilder, _requestView) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _aui2 = babelHelpers.interopRequireDefault(_aui);

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _request2 = babelHelpers.interopRequireDefault(_request);

    var _urls2 = babelHelpers.interopRequireDefault(_urls);

    var _listAndDetailView2 = babelHelpers.interopRequireDefault(_listAndDetailView);

    var _widget2 = babelHelpers.interopRequireDefault(_widget);

    var _mirrorView2 = babelHelpers.interopRequireDefault(_mirrorView);

    var _navBuilder2 = babelHelpers.interopRequireDefault(_navBuilder);

    var _requestView2 = babelHelpers.interopRequireDefault(_requestView);

    /**
     * @typedef MirrorStatus
     */

    // Required by the soy templates
    var MIRROR_STATUS = {
        ONLINE: 'online',
        OFFLINE: 'offline'
    };

    /**
     * @typedef MirrorRequest
     * @type {object}
     * @param {string} id           - the request's id
     * @param {string} mirrorName   - the requesting mirror's name
     */

    /**
     * @typedef Mirror
     * @type {object}
     * @param {string} id       - the mirror's id
     * @param {string} name     - the mirror's name
     * @param {string} baseUrl  - the mirror's base URL
     * @param {boolean} enabled - true if the mirrorServer is enabled, false otherwise
     */

    /**
     * Determines if the object contains only undefined or empty child objects
     * @param {Object|Array} value - The value to check
     * @returns {boolean} true if all child nodes are undefined, false otherwise
     */
    //eslint-disable-line no-unused-vars

    function isEmpty(value) {
        return _lodash2.default.isEmpty(value) || !_lodash2.default.any(value, function (item) {
            return !_lodash2.default.isEmpty(item);
        });
    }

    /**
     * Log a warning message when the list failed to refresh.
     * @param {object} response - the AJAX response object
     */
    function failedToRefresh(response) {
        var errors = _lodash2.default.get(response, 'responseJSON.errors');
        if (errors) {
            // one of our REST errors
            var errorMessage = errors.map(function (obj) {
                return obj.message;
            }).join('');
            console.warn('Failed to refresh list. Error: ' + errorMessage);
        } else {
            console.warn('Failed to refresh list. Unknown error.');
        }
    }

    var POLLING_MULTIPLIER_DEFAULT = 1;
    var POLLING_MULTIPLIER_HIDDEN = 10;

    var MirroringAdmin = function (_Widget) {
        babelHelpers.inherits(MirroringAdmin, _Widget);


        /**
         * Control for the entire mirroring admin UI panel.
         * @param {HTMLElement}          el                             - the element the UI panel is to be contained in
         * @param {object}               options                        - Options for MirroringAdmin
         * @param {Array<Mirror>}        [options.mirrors]              - the mirrors to show in the list
         * @param {Array<MirrorRequest>} [options.requests]             - the mirroring requests to show in the list
         * @param {boolean}              [options.unavailable]          - indicates if the feature is available
         * @param {string}               [options.unavailableMessage]   - an i18n'd string to add to the empty state if the
         *                                                                feature is not available. May not contain HTML.
         * @param {int}                  [options.refreshInterval]      - the number of ms at which to poll for new mirrors
         *                                                                and requests
         */

        function MirroringAdmin(el, options) {
            babelHelpers.classCallCheck(this, MirroringAdmin);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(MirroringAdmin).call(this, options));

            _this.$el = (0, _jquery2.default)(el);

            if (_this.options.unavailable) {
                _this.$el.html(bitbucket.internal.component.mirroringAdmin.main({
                    isEmpty: true,
                    unavailableText: _aui2.default.escapeHtml(_this.options.unavailableMessage)
                }));
            } else {
                _this.navListItems = {
                    mirror: {},
                    request: {}
                };
                _this.options.requests.forEach(function (item) {
                    return _this.addToNavListItems(item, 'request');
                });
                _this.options.mirrors.forEach(function (item) {
                    return _this.addToNavListItems(item, 'mirror');
                });

                _this.$el.html(bitbucket.internal.component.mirroringAdmin.main({ isEmpty: isEmpty(_this.navListItems) }));

                _this.listAndDetailView = new _listAndDetailView2.default(_this.$el.find('.mirroring-admin'), {
                    selectHandler: _this.itemSelectedHandler,
                    selectFirstOnInit: true,
                    selectedClass: 'selected-item',
                    listContent: bitbucket.internal.component.mirroringAdmin.navbar({
                        mirrors: _this.options.mirrors,
                        requests: _this.options.requests
                    })
                });

                _this.setPolling();
                (0, _jquery2.default)(document).on('visibilitychange', function () {
                    _this.setPolling(document.hidden ? POLLING_MULTIPLIER_HIDDEN : POLLING_MULTIPLIER_DEFAULT);
                });
            }
            return _this;
        }

        babelHelpers.createClass(MirroringAdmin, [{
            key: 'destroy',
            value: function destroy() {
                clearTimeout(this.timeout);
                clearInterval(this.statusInterval);
                babelHelpers.get(Object.getPrototypeOf(MirroringAdmin.prototype), 'destroy', this).call(this);
                this.$el.empty();
                this.$el = null;
            }
        }, {
            key: 'addToNavListItems',
            value: function addToNavListItems(item, type) {
                this.navListItems[type][item.id] = item;
            }
        }, {
            key: 'setPolling',
            value: function setPolling() {
                var multiplier = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

                if (multiplier <= 0) {
                    console.warn('Poll multiplier must be greater than 0.');
                    return;
                }
                this.multiplier = multiplier;
                clearTimeout(this.timeout);
                clearInterval(this.statusInterval);

                if (this.options.refreshInterval) {
                    this.timeout = setTimeout(this.refreshList, this.options.refreshInterval * multiplier);
                }
                this.checkMirrorStatus(multiplier);
            }
        }, {
            key: 'checkMirrorStatus',
            value: function checkMirrorStatus() {
                var _this2 = this;

                var intervalMinutes = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

                var frequency = 60 * 1000 * intervalMinutes; // eslint-disable-line no-magic-numbers
                var setAndPipeMirrorStatus = function setAndPipeMirrorStatus(mirror, status) {
                    _this2.setMirrorStatus(mirror, status);
                    return status;
                };

                var healthCheck = function healthCheck() {
                    if (_this2.navListItems.mirror) {
                        var requests = _lodash2.default.map(_this2.navListItems.mirror, function (mirror) {
                            // We use jQuery's ajax directly here, becuase this is a
                            // CORS call. The request will fail if we use ajax.rest,
                            // as the Server implementation adds headers that are not
                            // allowed by browsers without a pre-flight request. The
                            // '/status' endpoint does not handle pre-flight requests.
                            return _jquery2.default.ajax(mirror.baseUrl + '/status', {
                                method: 'HEAD',
                                timeout: frequency
                            }).then(function () {
                                return setAndPipeMirrorStatus(mirror, MIRROR_STATUS.ONLINE);
                            }, function () {
                                return setAndPipeMirrorStatus(mirror, MIRROR_STATUS.OFFLINE);
                            });
                        });
                        _this2._healthCheck = _jquery2.default.when.apply(_jquery2.default, babelHelpers.toConsumableArray(requests));
                    }
                };

                healthCheck();
                this.statusInterval = setInterval(healthCheck, frequency);
            }
        }, {
            key: 'itemSelectedHandler',
            value: function itemSelectedHandler($selectedItem, $listView, $detailView) {
                var type = $selectedItem.attr('data-type');
                var id = $selectedItem.attr('data-id');
                var viewData = { item: this.navListItems[type][id] };
                if (!viewData.item) {
                    return;
                }

                if (this.currentView) {
                    this.currentView.destroy();
                }

                var ViewClass = this.options.views[type];
                if (ViewClass) {
                    this.currentView = new ViewClass($detailView, viewData);
                    if (type === 'request') {
                        this.currentView.on('request-resolved', this.transitionItem);
                    } else if (type === 'mirror') {
                        this.currentView.on('mirror-removed', this.removeItem);
                    }
                } else {
                    throw new Error('Invalid view type \'' + type + '\'');
                }
            }
        }, {
            key: 'findBeforeElement',
            value: function findBeforeElement() {
                var $mirrors = this.listAndDetailView.$listView.find('.mirror'); // includes mirror-request items as well
                return $mirrors.length ? $mirrors[0] : (0, _jquery2.default)('#learn-more-mirroring');
            }
        }, {
            key: 'removeItem',
            value: function removeItem(options) {
                delete this.navListItems[options.type][options.id];
                var $item = this.listAndDetailView.$listView.find('[data-id="' + options.id + '"][data-type="' + options.type + '"]');
                this.listAndDetailView.removeItem($item, '.mirror');
                this.updateEmptyState();
            }
        }, {
            key: 'removeStaleItems',
            value: function removeStaleItems(handledItems) {
                var _this3 = this;

                Object.keys(this.navListItems).forEach(function (type) {
                    var existingItemIds = Object.keys(_this3.navListItems[type] || {});
                    var newItemIds = Object.keys(handledItems[type] || {});
                    var staleItemIds = _lodash2.default.difference(existingItemIds, newItemIds);
                    staleItemIds.forEach(function (id) {
                        _this3.removeItem({
                            type: type,
                            id: id
                        });
                    });
                });
            }
        }, {
            key: 'refreshList',
            value: function refreshList() {
                var _this4 = this;

                if (this.refreshPromise) {
                    return null;
                }

                var requestsPromise = _request2.default.rest({
                    type: 'GET',
                    url: _navBuilder2.default.rest().mirroring().path('requests').params({ state: 'pending' }).build(),
                    statusCode: {
                        '*': false
                    }
                });

                var mirrorsPromise = _request2.default.rest({
                    type: 'GET',
                    url: _navBuilder2.default.rest().mirroring().path('mirrorServers').build(),
                    statusCode: {
                        '*': false
                    }
                });

                var handledItems = {};
                var handleItem = function handleItem(item, type, template) {
                    if (!handledItems[type]) {
                        handledItems[type] = {};
                    }
                    handledItems[type][item.id] = item;
                    if (!_this4.navListItems[type] || !_this4.navListItems[type][item.id]) {
                        var selectItem = !_lodash2.default.some(_this4.navListItems, _lodash2.default.size);
                        _this4.addToNavListItems(item, type);
                        _this4.listAndDetailView.addItem((0, _jquery2.default)(template(babelHelpers.defineProperty({}, type, item))), _this4.findBeforeElement(), selectItem);
                    }
                };

                _aui2.default.$('.list-refresh-spinner').spin();

                var deferred = _jquery2.default.Deferred();
                this.refreshPromise = _jquery2.default.when(requestsPromise, mirrorsPromise);
                this.refreshPromise.always(function () {
                    _aui2.default.$('.list-refresh-spinner').spinStop();
                    _this4.refreshPromise = null;
                    if (_this4.options.refreshInterval) {
                        _this4.timeout = setTimeout(_this4.refreshList, _this4.options.refreshInterval * _this4.multiplier);
                    }
                }).done(function (requestPage, mirrorPage) {
                    requestPage[0].values.forEach(function (item) {
                        handleItem(item, 'request', bitbucket.internal.component.mirroringAdmin.mirrorRequestNavItem);
                    });
                    mirrorPage[0].values.forEach(function (item) {
                        handleItem(item, 'mirror', bitbucket.internal.component.mirroringAdmin.mirrorNavItem);
                    });
                    _this4.removeStaleItems(handledItems);
                    _this4.updateEmptyState();
                    deferred.resolve();
                }).fail(function (e) {
                    failedToRefresh(e);
                    deferred.reject();
                });

                return deferred.promise();
            }
        }, {
            key: 'setMirrorStatus',
            value: function setMirrorStatus(mirror, status) {
                var $item = this.listAndDetailView.$listView.find('[data-id="' + mirror.id + '"][data-type="mirror"]');
                var newStatus = bitbucket.internal.component.mirroringAdmin.mirrorStatus({ status: status });
                var $statusContainer = $item.find('.status-container');
                if (newStatus !== $statusContainer.html()) {
                    (function () {
                        $statusContainer.append(newStatus);

                        var $statuses = $item.find('.status');
                        var transitionClass = 'transitioning';
                        $statuses.one('transitionend', function () {
                            $statuses.last().removeClass(transitionClass);
                            $statuses.first().remove();
                        }).addClass(transitionClass);
                    })();
                }
            }
        }, {
            key: 'updateEmptyState',
            value: function updateEmptyState() {
                var empty = isEmpty(this.navListItems);
                (0, _jquery2.default)('.mirroring-admin').toggleClass('hidden', empty);
                (0, _jquery2.default)('.empty-state').toggleClass('hidden', !empty);
            }
        }, {
            key: 'transitionItem',
            value: function transitionItem(options) {
                switch (options.resolution) {
                    case 'accept':
                        var $item = this.transformToMirror(options);
                        $item.click();
                        break;
                    case 'reject':
                        this.removeItem(options);
                        break;
                }
                this.updateEmptyState();
            }
        }, {
            key: 'transformToMirror',
            value: function transformToMirror(options) {
                delete this.navListItems[options.type][options.id];
                var mirror = options.responseJSON;
                this.addToNavListItems(mirror, 'mirror');
                var $item = this.listAndDetailView.$listView.find('[data-id="' + options.id + '"][data-type="' + options.type + '"]');
                $item.removeClass('mirror-request');
                $item.attr('data-id', mirror.id);
                $item.attr('data-type', 'mirror');

                this.setMirrorStatus(mirror, mirror.enabled ? 'enabled' : 'disabled');

                return $item;
            }
        }]);
        return MirroringAdmin;
    }(_widget2.default);

    exports.default = MirroringAdmin;


    MirroringAdmin.defaults = {
        mirrors: [],
        requests: [],
        refreshInterval: 0, //Polling is _disabled_ by default.
        unavailable: false,
        unavailableMessage: '',
        views: {
            mirror: _mirrorView2.default,
            request: _requestView2.default
        }
    };
    module.exports = exports['default'];
});