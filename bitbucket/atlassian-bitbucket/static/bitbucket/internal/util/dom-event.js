'use strict';

define('bitbucket/internal/util/dom-event', ['jquery', 'lodash', 'bitbucket/internal/util/events', 'bitbucket/internal/util/navigator', 'exports'], function ($, _, events, navigatorUtil, exports) {

    'use strict';

    var isMac = navigatorUtil.isMac();

    /**
     * Returns true if a mouse click event should be handled in the same tab, false otherwise
     * @param e a jquery mouse event
     */
    exports.openInSameTab = function (e) {
        return (!e.which || e.which === 1) && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey && !navigatorUtil.isIE());
    };

    /* Returns true if a mouse click event was caused by a right button click, false otherwise*/
    exports.isRightClick = function (e) {
        return e.which === 3;
    };

    /* Return true if the ctrlKey is held down, or metaKey on Mac */
    exports.isCtrlish = function (e) {
        return isMac ? e.metaKey : e.ctrlKey;
    };

    /**
     * Linux: any modifier prevents scroll
     * FF: prevent scroll in Win and Mac when ANY modifier is pressed.
     * Chrome : Alt on Windows, Cmd on Mac handle history nav, and Shift on both OSes handles text highlighting.
     * Safari: Alt is history nav in Windows, Ctrl and Cmd both do it on Mac, and Shift only avoids scroll on Mac.
     * IE9: Alt key is history navigation.
     * @param e key event
     */
    exports.modifiersPreventScroll = function (e) {
        var result = false;

        if (navigatorUtil.isMozilla() || navigatorUtil.isLinux()) {

            result = isAnyModifierPressed(e);
        } else if (navigatorUtil.isChrome()) {

            result = e.shiftKey || (navigatorUtil.isWin() ? e.altKey : e.metaKey);
        } else if (navigatorUtil.isSafari()) {

            result = navigatorUtil.isWin() ? e.altKey : isAnyModifierPressed(e);
        } else if (navigatorUtil.isIE()) {

            result = e.altKey;
        }

        // Ensure the result is really a boolean, not just a truthy/falsy value
        return !!result;
    };

    function isAnyModifierPressed(e) {
        return e.altKey || e.shiftKey || e.ctrlKey || e.metaKey;
    }

    /**
     * When enabled, this function will send an event when a user changes their font size.
     */
    exports.listenForFontSizeChange = _.once(function () {
        var heightTest = $('<div style="position: fixed; visibility: hidden; speak: none; height: auto; top: -999px; left: -999px;">Ignore this text</div>').appendTo(document.body);
        var heightTestHeight = heightTest.height();
        var _checkHeight;
        var interval = 500;

        setTimeout(_checkHeight = function checkHeight() {
            var newHeight = heightTest.height();
            if (newHeight !== heightTestHeight) {
                heightTestHeight = newHeight;
                events.trigger('bitbucket.internal.util.events.fontSizeChanged');
            }
            setTimeout(_checkHeight, interval);
        }, interval);
    });

    /**
     * Returns a function which prevents the default action for the event, then calls `func` with the supplied arguments
     * @param {Function} func
     */
    exports.preventDefault = function (func) {
        return function (e /*, rest*/) {
            e && _.isFunction(e.preventDefault) && e.preventDefault();

            if (_.isFunction(func)) {
                return func.apply(this, arguments);
            }
        };
    };

    /**
     * Returns a function which stops propagation of the event, then calls `func` with the supplied arguments
     * @param {Function} func
     */
    exports.stopPropagation = function (func) {
        return function (e /*, rest*/) {
            e && _.isFunction(e.stopPropagation) && e.stopPropagation();

            if (_.isFunction(func)) {
                return func.apply(this, arguments);
            }
        };
    };

    /**
     * Only call the callback if the event target matches a selector
     * @param {HTMLElement|jQuery|string} target
     * @param {Function} func
     * @returns {Function}
     */
    exports.filterByTarget = function (target, func) {
        return function (e /*, rest*/) {
            if ($(e.target).is(target)) {
                return func.apply(this, arguments);
            }
        };
    };
});