'use strict';

define('bitbucket/internal/util/scroll', ['jquery', 'lodash', 'bitbucket/internal/util/feature-detect', 'exports'], function ($, _, featureDetect, exports) {

    'use strict';

    var defaults = {
        waitForImages: false, // Good for scrolling on page load
        cancelIfScrolled: false,
        duration: 400,
        getScrollPadding: function getScrollPadding() {
            return document.documentElement.clientHeight / 4;
        }
    };

    function scroll(destination, padding, duration) {
        $('html, body').animate({
            scrollTop: Math.max(0, destination - padding)
        }, duration);
    }

    function scrollTo($el, options) {
        var opts = $.extend({}, defaults, options);

        var cancelScroll = false;
        if (opts.cancelIfScrolled) {
            $(document).one('scroll', function () {
                cancelScroll = true;
            });
        }

        function scrollIfNotCancelled() {
            if (!cancelScroll) {
                var offset = $el.offset();
                if (offset) {
                    // $el is still in DOM and visible
                    scroll(offset.top, opts.getScrollPadding(), opts.duration);
                }
            }
        }

        if (opts.waitForImages) {
            $(document).imagesLoaded(scrollIfNotCancelled);
        } else {
            scrollIfNotCancelled();
        }
    }

    /**
     * Given a fixed or absolute-ly positioned "content" element, return a function to scroll it
     * in a "fake" way using transform: translate() or top: and left: depending on the browser.
     *
     * This simulates a container element being scrolled.
     *
     * @param {HTMLElement} el - the element representing "contents"
     * @param {object} [options]
     * @param {boolean} options.withDocument - should element scroll in the same direction as the document?
     *                                         i.e. you scroll down, the element moves down.
     * @returns {Function} a function that takes in a scrollLeft and scrollTop for the contents
     */
    function fakeScroll(el, options) {
        var transformProp = featureDetect.cssTransform();
        var cachedPos = { left: 0, top: 0 };
        var multiplier = -1;

        if (options && options.withDocument === true) {
            multiplier = 1;
        }
        /**
         * Cache the scroll position
         * @param {?number} left
         * @param {?number} top
         * @returns {{left: ?number, top: ?number}}
         */
        function cachedScrollPosition(left, top) {
            cachedPos.left = left == null ? cachedPos.left : left;
            cachedPos.top = top == null ? cachedPos.top : top;
            return cachedPos.left === 0 && cachedPos.top === 0 ? null : cachedPos;
        }

        var transformer;
        switch (transformProp) {
            case 'msTransform':
                transformer = function transformer(scrollPos) {
                    el.style[transformProp] = scrollPos === null ? "" : 'translate(' + Math.round(scrollPos.left) * multiplier + 'px, ' + Math.round(scrollPos.top) * multiplier + 'px)';
                };
                break;
            case undefined:
                transformer = function transformer(scrollPos) {
                    el.style.left = scrollPos === null ? "" : Math.round(scrollPos.left) * multiplier;
                    el.style.top = scrollPos === null ? "" : Math.round(scrollPos.top) * multiplier;
                };
                break;
            default:
                transformer = function transformer(scrollPos) {
                    el.style[transformProp] = scrollPos === null ? "" : 'translate3d(' + Math.round(scrollPos.left) * multiplier + 'px, ' + Math.round(scrollPos.top) * multiplier + 'px, 0)';
                };
        }

        return _.compose(transformer, cachedScrollPosition);
    }

    exports.scrollTo = scrollTo;
    exports.fakeScroll = fakeScroll;
});