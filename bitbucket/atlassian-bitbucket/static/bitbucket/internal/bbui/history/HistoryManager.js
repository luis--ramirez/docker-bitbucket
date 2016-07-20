define('bitbucket/internal/bbui/history/HistoryManager', ['module', 'exports', 'internal/util/navigator', '../widget/widget'], function (module, exports, _navigator, _widget) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _navigator2 = babelHelpers.interopRequireDefault(_navigator);

    var _widget2 = babelHelpers.interopRequireDefault(_widget);

    var History = function (_Widget) {
        babelHelpers.inherits(History, _Widget);

        function History(localWindow) {
            babelHelpers.classCallCheck(this, History);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(History).call(this));

            _this._localWindow = localWindow || window;
            _this.titleSuffix = '';
            _this._init();
            return _this;
        }

        babelHelpers.createClass(History, [{
            key: 'pushState',
            value: function pushState(state, title, url) {
                this._localWindow.history.pushState(state, title || '', url || '');
                this._maybeSetTitle(title);
                this.trigger('changestate', { state: state });
            }
        }, {
            key: 'replaceState',
            value: function replaceState(state, title, url) {
                this._localWindow.history.replaceState(state, title || '', url || '');
                this._maybeSetTitle(title);
                this.trigger('changestate', { state: state });
            }
        }, {
            key: 'state',
            value: function state() {
                return this._localWindow.history.state;
            }
        }, {
            key: 'initialState',
            value: function initialState(state) {
                return this._localWindow.history.replaceState(state, '', this._localWindow.location.href);
            }
        }, {
            key: 'setTitleSuffix',
            value: function setTitleSuffix(suffix) {
                this.titleSuffix = suffix || '';
            }
        }, {
            key: '_init',
            value: function _init() {
                var _this2 = this;

                //Safari fires an event on every page load. We want to swallow this event.
                var skipNextPop = _navigator2.default.isSafari();
                var listener = function listener(e) {
                    //The initial event in Safari has event.state === null so if the first event has some state
                    //then let it through.
                    if (e && (!skipNextPop || e.state !== null)) {
                        _this2.trigger('popstate', e);
                        _this2.trigger('changestate', e);
                    }

                    if (skipNextPop) {
                        skipNextPop = false;
                    }
                };
                this._localWindow.addEventListener('popstate', listener);

                this._addDestroyable(function () {
                    _this2._localWindow.removeEventListener('popstate', listener);
                });
            }
        }, {
            key: '_maybeSetTitle',
            value: function _maybeSetTitle(title) {
                if (title) {
                    this._localWindow.document.title = title + this.titleSuffix;
                }
            }
        }]);
        return History;
    }(_widget2.default);

    exports.default = History;
    module.exports = exports['default'];
});