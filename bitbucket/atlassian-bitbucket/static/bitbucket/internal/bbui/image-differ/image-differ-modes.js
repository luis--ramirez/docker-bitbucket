define('bitbucket/internal/bbui/image-differ/image-differ-modes', ['module', 'exports'], function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {

    /**
     * Display the images side by side for visual comparison
     */
    TWO_UP: 'two-up',

    /**
     * Blend the images together, using a slider to change the relative opacity of each image.
     */
    BLEND: 'blend',

    /**
     * Split the images vertically showing the old image on one side and the new image on the other.
     * Mouse position determines where the vertical split occurs.
     */
    SPLIT: 'split',

    /**
     * Combines the two images to calculate which pixels have changed between versions.
     * Shows changed pixels.
     */
    PIXEL_DIFF: 'pixeldiff'
  };
  module.exports = exports['default'];
});