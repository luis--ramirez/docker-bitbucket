define('bitbucket/internal/bbui/mirror-clone-selector/mirror-clone-selector', ['module', 'exports', 'jquery', 'lodash', 'bitbucket/internal/impl/urls', '../widget/widget'], function (module, exports, _jquery, _lodash, _urls, _widget) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _urls2 = babelHelpers.interopRequireDefault(_urls);

    var _widget2 = babelHelpers.interopRequireDefault(_widget);

    // Required by the soy templates


    var ELLIPSIS_PADDING = 15; //eslint-disable-line no-unused-vars

    var MirroringCloneSelector = function (_Widget) {
        babelHelpers.inherits(MirroringCloneSelector, _Widget);


        /**
         * @typedef {Object} MinimalMirror
         * @param {String} id       - the mirror's ID
         * @param {String} name     - the mirror's name
         * @param {String} url      - the path to the mirror repo info REST resource
         */

        /**
         * @typedef {Object} MirroredRepository
         * @param {String}              mirrorName  - the name of the mirror
         * @param {String}              id          - the ID of the mirror
         * @param {boolean}             available   - true if the repository is available on the mirror, false otherwise
         * @param {Object}              links       - a map of link type to link
         * @param {Array<NamedLink>}    links.clone - an array of clone urls available on the primary
         */

        /**
         * @typedef {Object} MinimalUpstreamServer
         * @param {String}              mirrorName  - the name
         * @param {Object}              links       - a map of link type to link
         * @param {Array<NamedLink>}    links.clone - an array of clone urls available on the primary
         */

        /**
         * @typedef {Object} NamedLink
         * @param {String} name - the type of link. Usually the protocol, for example: 'HTTP' or 'SSH'
         * @param {String} href - the URL - for this component usually a clone URL.
         */

        /**
         * Turns el into a mirroring clone URL selector.
         * @param {HTMLElement|jQuery}      el                                  - The container element
         * @param {Object}                  options                             - Options for this MirroringCloneSelector
         * @param {MinimalUpstreamServer}   options.primary                     - an object describing the upstream server's configuration
         * @param {String}                  options.cloneProtocol               - the current cloneProtocol.
         * @param {Function}                [options.updateCloneUrl=_.noop] - a function that is called after the clone url has been updated
         * @param {Function}                [options.updatePreferredMirror=_.noop] - a function that is called to update the preferred mirror
         * @param {Function<Promise<MinimalMirror>>} [options.getMirrors] - a function that returns a promise to an array of mirror servers to query.
         * @param {String}                  [options.preferredMirrorId=null]  - the ID of the preferred mirror server, or null if none is set
         */

        function MirroringCloneSelector(el, options) {
            babelHelpers.classCallCheck(this, MirroringCloneSelector);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(MirroringCloneSelector).call(this, options));

            _this.$el = (0, _jquery2.default)(el);
            _this.availableMirrors = [];
            _this.clicked = false;
            _this.loaded = false;
            _this.preferredMirrorId = _this.options.preferredMirrorId;
            _this.cloneProtocol = _this.options.cloneProtocol;
            _this.init();
            return _this;
        }

        /**
         * Adds an available mirror to the list
         * @param {MirroredRepository} mirroredRepository - A mirrored repository
         */


        babelHelpers.createClass(MirroringCloneSelector, [{
            key: 'addMirror',
            value: function addMirror(mirroredRepository) {
                if (mirroredRepository.available) {
                    this.availableMirrors.push(mirroredRepository);
                    var $availableMirrorsList = (0, _jquery2.default)('#available-mirror-list');
                    var $availableMirrors = $availableMirrorsList.find('li.mirror');
                    var $newMirror = (0, _jquery2.default)(bitbucket.internal.component.mirroringCloneSelector.mirrorItem({
                        item: mirroredRepository,
                        extraClasses: 'mirror'
                    }));
                    var $contextEl = _lodash2.default.find($availableMirrors, function (el) {
                        return (0, _jquery2.default)(el).text() > mirroredRepository.mirrorName;
                    });
                    if ($contextEl) {
                        $newMirror.insertBefore($contextEl);
                    } else {
                        $newMirror.appendTo($availableMirrorsList);
                    }

                    this.$trigger.removeAttr('disabled');

                    if (this.preferredMirrorId === mirroredRepository.id && !this.clicked) {
                        this.selectMirror(mirroredRepository.id);
                    }
                }
            }
        }, {
            key: 'getCloneUrl',
            value: function getCloneUrl(value) {
                return _lodash2.default.get(_lodash2.default.find(value.links.clone, 'name', this.getProtocol()), 'href', '');
            }
        }, {
            key: 'getProtocol',
            value: function getProtocol() {
                return this.cloneProtocol;
            }
        }, {
            key: 'hideDropdown',
            value: function hideDropdown() {
                if (this.$dropdown.is(':visible')) {
                    this.$trigger.trigger('aui-button-invoke');
                }
            }
        }, {
            key: 'init',
            value: function init() {
                this.$el.html(bitbucket.internal.component.mirroringCloneSelector.main({ primary: this.options.primary }));
                this.$trigger = this.$el.find('#available-mirrors-trigger');
                this.$trigger.on('click', function (e) {
                    return e.preventDefault();
                });
                this.initDropdown();
            }
        }, {
            key: 'initDropdown',
            value: function initDropdown() {
                var _this2 = this;

                this.$dropdown = (0, _jquery2.default)('#available-mirrors');

                /**
                 * @this {HTMLElement} the clicked element
                 */
                this.$dropdown.on('click', '.mirror-item', function (e) {
                    e.preventDefault();
                    _this2.selectMirror((0, _jquery2.default)(e.currentTarget).data('id'));
                    _this2._updatePreferredMirror();
                    _this2.clicked = true;
                });
            }
        }, {
            key: 'load',
            value: function load() {
                var _this3 = this;

                if (!this.loaded) {
                    this.loaded = true;
                    this.options.getMirrors().done(function (mirrors) {

                        var preferred = [];

                        if (_this3.preferredMirrorId) {
                            preferred = _lodash2.default.remove(mirrors, function (item) {
                                return item.id === _this3.preferredMirrorId;
                            });
                        }

                        preferred.forEach(function (mirror) {
                            _this3.loadMirror(mirror);
                        });

                        mirrors.forEach(function (mirror) {
                            _this3.loadMirror(mirror);
                        });
                    });
                }
            }
        }, {
            key: 'loadMirror',
            value: function loadMirror(mirror) {
                var _this4 = this;

                _jquery2.default.ajax({
                    type: 'GET',
                    contentType: 'application/json',
                    url: mirror.url,
                    dataType: 'json'
                }).done(function (availableMirror) {
                    availableMirror.id = mirror.id;
                    _this4.addMirror(availableMirror);
                });
            }
        }, {
            key: 'selectMirror',
            value: function selectMirror(mirrorId) {
                this.currentMirrorId = mirrorId;
                this.updateCloneUrl();
            }
        }, {
            key: 'showSetPushUpstream',
            value: function showSetPushUpstream(visible) {
                var $container = (0, _jquery2.default)('#update-push-url-container');
                if (visible) {
                    (0, _jquery2.default)('#update-push-url-input').val('git remote set-url --push origin ' + this.getCloneUrl(this.options.primary));
                    $container.removeClass('hidden');
                } else {
                    $container.addClass('hidden');
                }
            }
        }, {
            key: 'updateCloneProtocol',
            value: function updateCloneProtocol(protocol) {
                this.cloneProtocol = protocol;
                this.updateCloneUrl();
                return protocol;
            }
        }, {
            key: 'updateCloneUrl',
            value: function updateCloneUrl() {
                var currentMirror = void 0;
                if (this.currentMirrorId) {
                    currentMirror = _lodash2.default.find(this.availableMirrors, 'id', this.currentMirrorId);
                    this.showSetPushUpstream(true);
                } else {
                    currentMirror = this.options.primary;
                    this.showSetPushUpstream(false);
                }
                this.currentMirrorId = currentMirror.id;
                this.$trigger.text(currentMirror.mirrorName);
                // We need to set the maxWidth because: the label is i18n and can vary in width and the $trigger's width
                // is controlled by AUI.
                this.$trigger.css('maxWidth', this.$el.width() - this.$el.find('#clone-from-label').width() - ELLIPSIS_PADDING);

                this.options.updateCloneUrl(this.getProtocol(), this.getCloneUrl(currentMirror));
            }
        }, {
            key: 'show',
            value: function show() {
                this.$el.show();
            }
        }, {
            key: 'hide',
            value: function hide() {
                this.hideDropdown();
                this.$el.hide();
            }
        }, {
            key: '_updatePreferredMirror',
            value: function _updatePreferredMirror() {
                this.preferredMirrorId = this.currentMirrorId;
                this.options.updatePreferredMirror(this.preferredMirrorId);
            }
        }]);
        return MirroringCloneSelector;
    }(_widget2.default);

    exports.default = MirroringCloneSelector;


    MirroringCloneSelector.defaults = {
        cloneProtocol: 'http',
        preferredMirrorId: null,
        updateCloneUrl: _lodash2.default.noop,
        updatePreferredMirror: _lodash2.default.noop,
        getMirrors: function getMirrors() {
            return _jquery2.default.when([]);
        }
    };
    module.exports = exports['default'];
});