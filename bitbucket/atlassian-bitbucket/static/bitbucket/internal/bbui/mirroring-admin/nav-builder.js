define('bitbucket/internal/bbui/mirroring-admin/nav-builder', ['module', 'exports', 'aui'], function (module, exports, _aui) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _aui2 = babelHelpers.interopRequireDefault(_aui);

    var Builder = function () {
        function Builder(path) {
            babelHelpers.classCallCheck(this, Builder);

            this._path = path;
        }

        babelHelpers.createClass(Builder, [{
            key: 'mirroring',
            value: function mirroring() {
                return this.path('mirroring', 'latest');
            }
        }, {
            key: 'panel',
            value: function panel(id) {
                return this.path('mirrorServers', id, 'webPanels', 'config');
            }
        }, {
            key: 'path',
            value: function path() {
                if (this._path.indexOf('?') >= 0) {
                    throw new Error('Can\'t add path components after query params!');
                }

                for (var _len = arguments.length, comps = Array(_len), _key = 0; _key < _len; _key++) {
                    comps[_key] = arguments[_key];
                }

                this._path += '/' + comps.map(encodeURIComponent).join('/');
                return this;
            }
        }, {
            key: 'params',
            value: function params(obj) {
                var _this = this;

                if (this._path.indexOf('?') >= 0) {
                    throw new Error('params can only be called once. Pass all query params in the obj!');
                }
                if (obj) {
                    (function () {
                        var params = [];
                        Object.keys(obj).forEach(function (key) {
                            params.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
                        });
                        _this._path += params.length ? '?' + params.join('&') : '';
                    })();
                }
                return this;
            }
        }, {
            key: 'build',
            value: function build() {
                return _aui2.default.contextPath() + this._path;
            }
        }]);
        return Builder;
    }();

    /**
     * Mirroring specific REST URL Builder.
     */
    var NavBuilder = {
        rest: function rest() {
            return new Builder('/rest');
        }
    };

    exports.default = NavBuilder;
    module.exports = exports['default'];
});