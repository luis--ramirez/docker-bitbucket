define('bitbucket/internal/bbui/image-differ/image-differ-toolbar', ['module', 'exports', 'jquery', 'lodash', '../widget/widget', './image-differ-modes'], function (module, exports, _jquery, _lodash, _widget, _imageDifferModes) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _widget2 = babelHelpers.interopRequireDefault(_widget);

    var _imageDifferModes2 = babelHelpers.interopRequireDefault(_imageDifferModes);

    var ImageDiffToolbar = function (_Widget) {
        babelHelpers.inherits(ImageDiffToolbar, _Widget);

        function ImageDiffToolbar(toolbarEl) {
            babelHelpers.classCallCheck(this, ImageDiffToolbar);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(ImageDiffToolbar).call(this));

            _this._$toolbar = (0, _jquery2.default)(toolbarEl);
            _this._$toggle = _this._$toolbar.find('.image-differ-toggle');
            return _this;
        }

        /**
         * Initialize the toolbar and enable all diffing modes, if appropriate.
         *
         * @param {Array.<string>} enabledModes - an array of enabled {@link ImageDifferModes}
         */


        babelHelpers.createClass(ImageDiffToolbar, [{
            key: 'init',
            value: function init(enabledModes) {
                var _this2 = this;

                var buttons = {};
                _lodash2.default.values(_imageDifferModes2.default).forEach(function (mode) {
                    // Check all available modes against the enabled modes and
                    // set the button state for it accordingly.
                    var isModeEnabled = enabledModes.indexOf(mode) !== -1;
                    var $button = _this2._$toggle.find('.image-differ-' + mode);
                    $button.attr('aria-disabled', !isModeEnabled).prop('disabled', !isModeEnabled);

                    if (!isModeEnabled) {
                        return;
                    }
                    if ($button.attr('data-enabled-title')) {
                        $button.attr('data-disabled-title', $button.attr('title'));
                    }

                    $button.attr('data-mode', mode);
                    $button.attr('title', $button.attr('data-enabled-title'));
                    buttons[mode] = $button;
                });

                /* TODO: Remove when dropping IE9 Support in Stash */
                if (enabledModes.indexOf(_imageDifferModes2.default.BLEND) !== -1) {
                    // don't show blend mode for old browsers (<= IE9)
                    var supportsRangeInput = function () {
                        var el = document.createElement('input');
                        el.setAttribute('type', 'range');
                        return el.type === 'range';
                    }();
                    var $button = buttons[_imageDifferModes2.default.BLEND];
                    $button.attr('aria-disabled', !supportsRangeInput).prop('disabled', !supportsRangeInput);
                    if (!supportsRangeInput) {
                        $button.attr('title', $button.attr('data-disabled-title'));
                    }
                }

                /**
                 * Trigger a local modeChanged event and set the mode
                 * @param {string} newMode - The new mode
                 */
                var changeMode = function changeMode(newMode) {
                    var oldMode = _this2._mode;
                    _this2._mode = newMode;
                    _this2.trigger('modeChanged', {
                        newMode: newMode,
                        oldMode: oldMode
                    });
                };

                var $modeListButtons = this._$toggle.find('.aui-button');

                $modeListButtons.on('click', function (e) {
                    e.preventDefault();
                    var $el = (0, _jquery2.default)(e.target);
                    if ($el.attr('aria-disabled') !== 'true' && $el.attr('aria-pressed') !== 'true') {
                        var newMode = $el.attr('data-mode');
                        $modeListButtons.attr('aria-pressed', 'false');
                        $el.attr('aria-pressed', 'true');
                        changeMode(newMode);
                    }
                }).tooltip({ gravity: 's' });

                changeMode(_imageDifferModes2.default.TWO_UP);
            }
        }, {
            key: 'getMode',
            value: function getMode() {
                return this._mode;
            }
        }, {
            key: 'destroy',
            value: function destroy() {
                if (this._$toolbar) {
                    this._$toolbar.remove();
                    this._$toolbar = null;
                }
                this._$toggle = null;
            }
        }]);
        return ImageDiffToolbar;
    }(_widget2.default);

    exports.default = ImageDiffToolbar;
    module.exports = exports['default'];
});