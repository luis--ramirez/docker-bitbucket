define('bitbucket/internal/bbui/avatars/avatars', ['module', 'exports', 'jquery', 'lodash'], function (module, exports, _jquery, _lodash) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    exports.default = {
        init: _lodash2.default.once(function () {
            (0, _jquery2.default)('.avatar-tooltip > .aui-avatar-inner > img').tooltip({
                hoverable: false,
                offset: 5,
                gravity: function gravity() {
                    // Always position on screen
                    return _jquery2.default.fn.tipsy.autoNS.call(this) + _jquery2.default.fn.tipsy.autoWE.call(this);
                },
                delayIn: 0,
                live: true
            });
        })
    };
    module.exports = exports['default'];
});