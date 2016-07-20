define('bitbucket/internal/bbui/bb-panel/bb-panel', ['module', 'exports', 'aui', 'jquery', 'skate'], function (module, exports, _aui, _jquery, _skate) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _aui2 = babelHelpers.interopRequireDefault(_aui);

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _skate2 = babelHelpers.interopRequireDefault(_skate);

    /**
     * @param {BBPanel} el - The bb-panel to search for an anchor
     * @returns {Element|null} - The anchor element for this panel if it exists, or {@like null}
     */
    function getAnchor(el) {
        return document.getElementById(el.getAttribute('anchor-to'));
    }

    /**
     * @param {BBPanel} el - A BBPanel
     * @param {Function<Element>} callback - The callback to call with the anchor.
     */
    function doIfAnchor(el, callback) {
        var anchor = getAnchor(el);

        if (anchor) {
            callback(anchor);
        }
    }

    /**
     * Asks layer manager to display the panel
     *
     * @param {BBPanel} el - A BBPanel
     */
    function showPanel(el) {
        doIfAnchor(el, function (anchor) {
            // TODO consider the window resizing...
            var $anchor = (0, _jquery2.default)(anchor);
            var offset = $anchor.offset();
            var xOffset = Math.floor(offset.left);
            var yOffset = Math.floor(offset.top + $anchor.outerHeight());
            el.style.transform = 'translate3d(' + xOffset + 'px, ' + yOffset + 'px, 0)';
        });

        _aui2.default.layer(el).show();
    }

    /**
     * Requests layer manager hides the panel
     *
     * @param {BBPanel} el - The bb-panel to hide
     */
    function hidePanel(el) {
        _aui2.default.layer(el).hide();
    }

    function updateShowing(el, showing) {
        if (showing) {
            showPanel(el);
        } else {
            hidePanel(el);
        }
    }

    var BBPanel = (0, _skate2.default)('bb-panel', {
        properties: {
            // Used by AUI Layer Manager to hide the panel when it wants to hide the layer.
            'aria-hidden': _skate2.default.properties.string({
                attribute: true,
                default: 'true',
                set: function set(el, change) {
                    el.open = change.newValue === 'false';
                }
            }),

            // Main attribute/property used to control the state of the panel
            'open': _skate2.default.properties.boolean({
                attribute: true,
                default: false,
                set: function set(el, change) {
                    if (change.oldValue !== change.newValue && document.body.contains(el)) {
                        updateShowing(el, change.newValue);
                    }
                }
            })
        },
        attached: function attached(el) {
            var isInitalizing = !el.hasAttribute('aria-hidden');
            var shouldBeOpen = el.hasAttribute('open');
            if (isInitalizing || el.open !== shouldBeOpen) {
                updateShowing(el, shouldBeOpen);
            }
        },
        render: function render(element) {
            (0, _jquery2.default)(element).addClass('aui-layer');
        }
    });

    exports.default = BBPanel;
    module.exports = exports['default'];
});