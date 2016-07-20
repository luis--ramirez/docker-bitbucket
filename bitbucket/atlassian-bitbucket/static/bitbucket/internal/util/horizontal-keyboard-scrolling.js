'use strict';

define('bitbucket/internal/util/horizontal-keyboard-scrolling', ['jquery'], function ($) {
    'use strict';

    var isInitialised = false;
    var isPaused = false;
    var RIGHT_ARROW = 39;
    var LEFT_ARROW = 37;

    /**
     * How big each step is per scroll on the mouse wheel
     * @type {number}
     */
    var SCROLL_STEP = 50;
    var REGEX_INPUTS = /INPUT|SELECT|TEXTAREA/i;
    var editors = null;

    var horizontalKeyboardScroll = {
        init: function init() {
            if (!isInitialised) {
                isInitialised = true;
                $(document).on('keydown', function (e) {
                    if (!isPaused && (e.keyCode === LEFT_ARROW || e.keyCode === RIGHT_ARROW)) {
                        var target = e.target;
                        if (target && REGEX_INPUTS.test(target.tagName)) {
                            return;
                        }

                        if (editors && editors.length) {
                            editors.forEach(function (editor) {
                                var scrollInfo = editor.getScrollInfo();

                                if (scrollInfo.width > scrollInfo.clientWidth) {
                                    var delta = e.keyCode === LEFT_ARROW ? -SCROLL_STEP : SCROLL_STEP;
                                    var newScrollLeft = scrollInfo.left + delta;
                                    var edgeOfRight = scrollInfo.width - scrollInfo.clientWidth;
                                    newScrollLeft = newScrollLeft > edgeOfRight ? edgeOfRight : newScrollLeft;

                                    editor.scrollTo(newScrollLeft, null);
                                    e.preventDefault();
                                }
                            });
                        }
                    }
                });
            }
        },
        setEditors: function setEditors(newEditors) {
            editors = newEditors;
        },
        /**
         * On overview of the Pull request page, we probably don't want to have this feature on.
         */
        pause: function pause() {
            isPaused = true;
        },
        resume: function resume() {
            isPaused = false;
        }
    };

    return horizontalKeyboardScroll;
});