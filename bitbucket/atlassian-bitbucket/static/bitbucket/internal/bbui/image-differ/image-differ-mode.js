define("bitbucket/internal/bbui/image-differ/image-differ-mode", ["module", "exports"], function (module, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var ImageDifferMode = function () {

    /**
     * @param {Function} [setup] - A setup method for the mode
     * @param {Function} [destroy] - A destroy method for the mode where it cleans up after itself
     */

    function ImageDifferMode(setup, destroy) {
      babelHelpers.classCallCheck(this, ImageDifferMode);

      if (setup) {
        this.setup = setup;
      }
      if (destroy) {
        this.destroy = destroy;
      }
    }

    /**
     * A setup method for the mode
     */


    babelHelpers.createClass(ImageDifferMode, [{
      key: "setup",
      value: function setup() {}
    }, {
      key: "destroy",
      value: function destroy() {}
    }]);
    return ImageDifferMode;
  }();

  exports.default = ImageDifferMode;
  module.exports = exports["default"];
});