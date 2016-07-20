define("bitbucket/internal/util/async-element-resize-helper", ["module", "exports"], function (module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    exports.default = function (elem, cb) {
        if (!elem) {
            throw new Error("asyncElementResizeHelper called with null elem");
        }
        requestAnimationFrame(function () {
            var w = elem.clientWidth;
            var h = elem.clientHeight;
            if (!elem._cachedSize || elem._cachedSize.w !== w || elem._cachedSize.h !== h) {

                elem._cachedSize = { w: w, h: h };
                cb();
            }
        });
    };

    module.exports = exports["default"];
});