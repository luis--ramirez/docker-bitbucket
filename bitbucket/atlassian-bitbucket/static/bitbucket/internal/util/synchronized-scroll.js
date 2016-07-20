'use strict';

define('bitbucket/internal/util/synchronized-scroll', ['lodash', 'bitbucket/internal/model/direction', 'bitbucket/internal/util/function', 'bitbucket/internal/util/math', 'bitbucket/internal/util/performance', 'exports'],
/**
 * Used for synchronizing the scroll positions of two elements in such a way that
 * regions within those two elements are on-screen at approximately the same times.
 *
 * @exports bitbucket/internal/util/synchronized-scroll
 */
function (_, Direction, fn, math, performance, exports) {

    'use strict';

    var spreadMultiply = fn.spread(math.multiply);
    function weightedAverage(items, weights) {
        // NOTE: The weights add up to 1, so there is no need to divide by the total weight to get the average.
        return _.chain(_.zip(items, weights)).map(spreadMultiply).reduce(math.add, 0).value();
    }

    /**
     * Returns an object that represents a single scrollable UI element. This object implements all the methods required
     * for synchronized scrolling with other elements.
     *
     * @param {HTMLElement|jQuery} el - a jQuery-able to reference for scroll information
     * @constructor
     */
    function Scrollable(el) {
        if (el instanceof Scrollable) {
            return el;
        }
        if (!(this instanceof Scrollable)) {
            return new Scrollable(el);
        }
        this._el = el;
        this._programmatic = false;
        return this;
    }

    /**
     * Get dimensions and scroll location for this scrollable in px.
     *
     * @returns {{top: number, left: number, width: number, height: number, clientWidth: number, clientHeight: number}}
     */
    Scrollable.prototype.getScrollInfo = function () {
        return {
            top: this._el.scrollTop,
            left: this._el.scrollLeft,
            width: this._el.scrollWidth,
            height: this._el.scrollHeight,
            clientWidth: this._el.clientWidth,
            clientHeight: this._el.clientHeight
        };
    };

    /**
     * Set a location to scroll to.
     *
     * @param {number} [x] - A new scrollLeft value, or null to ignore
     * @param {number} [y] - A new scrollTop value, or null to ignore
     */
    Scrollable.prototype.scrollTo = function (x, y) {
        if (y != null) {
            this._programmatic = true;
            this._el.scrollTop = y;
        }
        if (x != null) {
            this._programmatic = true;
            this._el.scrollLeft = x;
        }
    };
    /**
     * Return whether a programmatic scroll has occurred since the last time this method was called, and reset it to false.
     * @returns {*}
     */
    Scrollable.prototype.getAndUnsetProgrammaticScrollMarker = function () {
        var ret = this._programmatic;
        this._programmatic = false;
        return ret;
    };

    /**
     * Returns an object that represents a vertical 'region' within a scrollable. This object implements methods
     * that provide dimensions and offsets for the region, relative to the parent scrollable.
     *
     * @param {Scrollable} scrollable - the parent scrollable for this region
     * @param {HTMLElement} el - a DOM element to reference for region dimensions
     * @constructor
     */
    function Region(scrollable, el) {
        if (!(this instanceof Region)) {
            return new Region(scrollable, el);
        }
        this._el = el;
        this._parentScrollable = scrollable;
        if (!this._parentScrollable._el) {
            throw new Error("Regions can't (yet) be created for custom Scrollables. We would need to solve the API problem of where to put a function to get the offset relative to the top of the scrollable.");
        }
        return this;
    }

    /**
     * Get the height of the region
     * @returns {number} height of this region
     */
    Region.prototype.getHeight = function () {
        return this._el.offsetHeight;
    };

    /**
     * Get this region's vertical offset (px) from the parent {@link Scrollable}. It should be negative
     * if the region begins above the visible area of the Scrollable, and positive otherwise.
     * @returns {number}
     */
    Region.prototype.getOffsetTop = function () {
        return this._el.getBoundingClientRect().top - this._parentScrollable._el.getBoundingClientRect().top;
    };

    function scrollTopFromDistanceToTop(info, dist) {
        return dist;
    }

    function scrollTopFromDistanceToBottom(info, dist) {
        return info.scrollHeight - info.clientHeight - dist;
    }

    var distanceToTop = fn.dot('scrollTop');

    function distanceToBottom(info) {
        return info.scrollHeight - info.clientHeight - info.scrollTop;
    }

    /**
     * This function takes 3 different methods of "synchronized" scrolling and returns a weighted average of all of them.
     *
     * It uses:
     * - a "linked" algorithm that tries to keep 'linked' regions in each scrollable on screen at the same time.
     * - a "topness" algorithm that tries to move scrollables toward the top at proportional speeds.
     * - a "bottomness" algorithm that tries to move scrollables toward the bottom at proportional speeds.
     *
     * The "linked" algorithm is ideal towards the middle of a diff. The "topness" algorithm is important at the top
     * of a diff so dependent scrollables reach the top and aren't left hanging somewhere in the middle of the diff.
     * Similarly, the "bottomness" algorithm is important at the bottom for the same reason.
     *
     * @param {Object} selfOldInfo
     * @param {Object} selfInfo
     * @param {Object[]} otherInfos
     * @param {Function} getRegions
     * @param {Function} getLinkedRegion
     * @param {number} focusHeightFraction
     * @returns {Array} of scroll commands, shaped like {scrollable: Scrollable, scrollTop: number, scrollLeft: number }
     */
    function getSynchedScrollCommands(selfOldInfo, selfInfo, otherInfos, getRegions, getLinkedRegion, focusHeightFraction) {
        // we don't care about any scrollables that are too small to scroll.
        var scrolledVertically = selfInfo.scrollTop !== selfOldInfo.scrollTop;
        var scrolledHorizontally = selfInfo.scrollLeft !== selfOldInfo.scrollLeft;
        otherInfos = _.filter(otherInfos, function (info) {
            return scrolledVertically && info.canScrollVertically || scrolledHorizontally && info.canScrollHorizontally;
        });

        if (!otherInfos.length) {
            return [];
        }

        if (!scrolledVertically) {
            // shortcut if we only have horizontal scrolls - they're easier
            return _.map(otherInfos, function (otherInfo) {
                return getScrollCommand(otherInfo, null, selfInfo.scrollLeft);
            });
        }

        var thisDirection = selfInfo.scrollTop > selfOldInfo.scrollTop ? Direction.DOWN : Direction.UP;

        var allInfos = otherInfos.concat(selfInfo);
        var verticallyRelevantInfos = _.filter(allInfos, fn.dot('canScrollVertically'));
        var binaryMax = fn.binary(Math.max);
        function maxPropValue(arr, prop) {
            return _.chain(arr).pluck(prop).reduce(binaryMax, 0).value();
        }
        var topness = maxPropValue(verticallyRelevantInfos, 'topness') * (thisDirection === Direction.UP ? 1 : 0);
        var bottomness = maxPropValue(verticallyRelevantInfos, 'bottomness') * (thisDirection === Direction.UP ? 0 : 1);

        // -ness^2 means further distances decrease faster (exponentially)
        // weights are represented as [ linkedWeight, topnessWeight, bottomnessWeight ]
        var weights = balanceWeights(topness * topness, bottomness * bottomness, thisDirection);

        var linkedWeight = weights[0];
        var topnessWeight = weights[1];
        var bottomnessWeight = weights[2];

        var linkedScrolls = linkedWeight > 0 ? getLinkedScrollTops(focusHeightFraction, selfInfo, otherInfos, getRegions, getLinkedRegion) : [];
        var topnessScrolls = topnessWeight > 0 ? _.map(otherInfos, thisDirection === Direction.UP ? proportionalScroll(selfOldInfo, selfInfo, distanceToTop, scrollTopFromDistanceToTop) : equivalentScroll(selfOldInfo, selfInfo, distanceToTop, scrollTopFromDistanceToTop)) : [];
        var bottomnessScrolls = bottomnessWeight > 0 ? _.map(otherInfos, thisDirection === Direction.DOWN ? proportionalScroll(selfOldInfo, selfInfo, distanceToBottom, scrollTopFromDistanceToBottom) : equivalentScroll(selfOldInfo, selfInfo, distanceToBottom, scrollTopFromDistanceToBottom)) : [];

        return _.chain(otherInfos).zip(_.zip(linkedScrolls, topnessScrolls, bottomnessScrolls)).map(fn.spread(function (scrollableInfo, scrollSuggestions) {
            var shouldScrollHorizontally = scrollableInfo.scrollLeft !== selfInfo.scrollLeft;

            if (!scrollableInfo.canScrollVertically) {
                // shortcut for horizontal scrolls.
                return getScrollCommand(scrollableInfo, null, shouldScrollHorizontally && scrollableInfo.canScrollHorizontally ? selfInfo.scrollLeft : null);
            }

            var normalizedSuggestions = scrollSuggestions.map(fn.defaultValue(0)).map(math.clamp(0, scrollableInfo.scrollHeight));

            var scrollTop = weightedAverage(normalizedSuggestions, weights);
            var scrollTopChange = scrollTop - scrollableInfo.scrollTop;
            // Don't scroll if nothing is changing.
            // Don't scroll in the opposite direction of the current scroll. That's weird looking.
            var shouldScrollVertically = 0 < (thisDirection === Direction.UP ? -1 : 1) * scrollTopChange;

            if (!shouldScrollVertically && !shouldScrollHorizontally) {
                return null;
            }

            return getScrollCommand(scrollableInfo, shouldScrollVertically ? scrollTop : null, shouldScrollHorizontally ? selfInfo.scrollLeft : null);
        })).filter(_.identity).value();
    }

    /**
     * Given the weight for each algorithm's scrollTop values, balance them to add up to 1, and return
     * them as an array of [ newLinkedWeight, newTopnessWeight, newBottomnessWeight ]
     *
     * @param {number} topnessWeight
     * @param {number} bottomnessWeight
     * @param {string} dir
     * @returns {number[]} array of length 3 - [ newLinkedWeight, newTopnessWeight, newBottomnessWeight ]
     */
    function balanceWeights(topnessWeight, bottomnessWeight, dir) {
        // The greater of topness/bottomness weights takes precendence and will be weighted at face value.
        // the lesser will split the remaining weight with linkedWeight at a ratio of x-to-1.
        // e.g. if topnessWeight = 0.75, bottomnessWeight = 0.5, then linkedWeight and bottomnessWeight will share the 0.25 at a ratio of 1-to-0.5
        // weights = [ 0.25/1.5 , 0.75, 0.25 * 0.5 / 1.5 ]
        var maxEdgeWeight = Math.max(topnessWeight, bottomnessWeight);
        var minEdgeWeight = Math.min(topnessWeight, bottomnessWeight);

        var linkedWeight = (1 - maxEdgeWeight) / (1 + minEdgeWeight);
        var rebalancedMinWeight = (1 - maxEdgeWeight) * minEdgeWeight / (1 + minEdgeWeight);

        // the greater weight takes precendence. scroll direction is the tie-breaker.
        var topTakesPrecedence = topnessWeight > bottomnessWeight || topnessWeight === bottomnessWeight && dir === Direction.UP;

        return [linkedWeight, topTakesPrecedence ? maxEdgeWeight : rebalancedMinWeight, topTakesPrecedence ? rebalancedMinWeight : maxEdgeWeight];
    }

    /**
     * Return a scroll command
     * @param {Object} scrollableInfo
     * @param {number|null} scrollTop
     * @param {number|null} scrollLeft
     * @returns {{scrollable: Scrollable, scrollTop: number|null, scrollLeft: number|null}}
     */
    function getScrollCommand(scrollableInfo, scrollTop, scrollLeft) {
        return {
            scrollable: scrollableInfo.scrollable,
            scrollTop: scrollTop,
            scrollLeft: scrollLeft
        };
    }

    /**
     * Given information about a scrollable's old position and new position, this function will return a function that
     * takes in a second scrollable and calculates a scrollTop value for it. The calculation is based on moving the second scrollable
     * an equivalent proportion of the distance that the first scrollable moved, relative to a given edge (top or bottom).
     *
     * That is, if the first scrollable was at 8px from the edge, and is now at 2px from the edge, then it has moved a proportion
     * of 6/8th (or 75%) of the distance to the edge. So if the second scrollable is currently 100px away from the edge,
     * it will be moved 75px, or 75%, closer to the edge.
     *
     * This algorithm ensures that scrollbars will all reach the edge together, with no scrollbar left "hanging" in the middle.
     *
     * @param {Object} thisOldInfo - pre-scroll scrollable info for the reference Scrollable
     * @param {Object} thisInfo - post-scroll scrollable info for the reference Scrollable
     * @param {function(Object)} getDistanceToEdge - a function that takes in a scrollable info and returns the distance to the edge in pixels.
     * @param {function(Object, number)} convertDistanceToScrollTop - a function that takes in scrollable info and a pixel distance and outputs a scrollTop value.
     * @returns {function(Object) : number} a function that takes in a scrollableInfo and outputs a scrollTop
     */
    function proportionalScroll(thisOldInfo, thisInfo, getDistanceToEdge, convertDistanceToScrollTop) {
        // HACK: avoids getting n/(super-small-or-zero) === Infinity results
        var notQuiteZero = 1;
        var thisOldDistance = Math.max(getDistanceToEdge(thisOldInfo), notQuiteZero);

        // new distance should be a proportional move from the current distance.
        // (scrolledOldDistance - scrolledNewDistance) / scrolledOldDistance <=>
        //     scrollProportion <=> (otherOldDistance - otherNewDistance) / otherOldDistance
        // otherNewDistance = otherOldDistance - scrollProportion * otherOldDistance
        var scrollProportion = (thisOldDistance - getDistanceToEdge(thisInfo)) / thisOldDistance;

        return function (info) {
            // HACK: symmetry with the above HACK which avoids Infinity values
            var otherDistance = Math.max(getDistanceToEdge(info), notQuiteZero);

            var out = otherDistance - scrollProportion * otherDistance;

            // avoid pixel jiggles as we reach the top or bottom due to our Infinity hack.
            if (out < 1) {
                out = 0;
            }

            return convertDistanceToScrollTop(info, out);
        };
    }

    /**
     * Scroll the others an equal distance to how far you've scrolled.
     *
     * @param {Object} thisOldInfo - pre-scroll scrollable info for the reference Scrollable
     * @param {Object} thisInfo - post-scroll scrollable info for the reference Scrollable
     * @param {function(Object)} getDistanceToEdge - a function that takes in a scrollable info and returns the distance to the edge in pixels.
     * @param {function(Object, number)} convertDistanceToScrollTop - a function that takes in scrollable info and a pixel distance and outputs a scrollTop value.
     * @returns {function(Object) : number} a function that takes in a scrollableInfo and outputs a scrollTop
     */
    function equivalentScroll(thisOldInfo, thisInfo, getDistanceToEdge, convertDistanceToScrollTop) {
        var thisOldDistance = getDistanceToEdge(thisOldInfo);
        var change = getDistanceToEdge(thisInfo) - thisOldDistance;

        return function (info) {
            var out = getDistanceToEdge(info) + change;
            return convertDistanceToScrollTop(info, out);
        };
    }

    /**
     * Determine the scrollTop for each dependent scrollable based on keeping their linked regions as closely aligned as possible.
     *
     * The algorithm is essentially:
     * - find the pixel height "offset-line" for the given `focusHeightFraction`
     * - find the region in the reference scrollable that contains that offset line.
     * - given that region, find the linked region in each of the dependent scrollables
     * - determine the fraction of the reference region's area that is above the offset line.
     * - return the scrollTop for each dependent scrollable that would cause it's linked region to have the same fraction of area above the offset line.
     *
     * @param {number} focusHeightFraction - the fraction of the way down the visible frame that we should attemp to show linked regions for.
     * @param {Object} selfInfo - scrollableInfo for the reference scrollable
     * @param {Array} otherInfos - scrollableInfos for the dependent scrollables.
     * @param {function(Scrollable)} getRegions - get the regions within a scrollable
     * @param {function(Region, Scrollable)} getLinkedRegion - get the region within the given scrollable that is linked to the provided region.
     * @returns {*}
     */
    function getLinkedScrollTops(focusHeightFraction, selfInfo, otherInfos, getRegions, getLinkedRegion) {
        // how many pixels from the top of the "window" visible frame is the imaginary
        // line where we'll like things to align across files
        var refPointOffset = selfInfo.clientHeight * focusHeightFraction;

        var selfRegions = getRegions(selfInfo.scrollable);

        // which el in the scrolled document is crossing the line
        var refRegionInfo = getRegionInfoAtYOffset(refPointOffset, selfRegions);

        var linkedRegionInfos = otherInfos.map(function (scrollableInfo) {
            if (!scrollableInfo.canScrollVertically) {
                return null;
            }
            return getRegionInfo(getLinkedRegion(refRegionInfo.region, scrollableInfo.scrollable));
        });

        // find out how far through the imaginary line our el in the scrolled document is
        var fractionPastRef = getFractionThroughRefPoint(refPointOffset, refRegionInfo);

        return _.zip(linkedRegionInfos, otherInfos).map(fn.spread(function (regionInfo, scrollableInfo) {
            if (!scrollableInfo.canScrollVertically) {
                return null;
            }
            var expectedOffsetRefPoint = scrollableInfo.clientHeight * focusHeightFraction;
            // what position would we need to link up the matching region
            var expectedPosition = positionForFractionThroughRefPoint(expectedOffsetRefPoint, fractionPastRef, regionInfo);
            var oldScrollTop = scrollableInfo.scrollTop;

            // get the scrollTop that would give us that position
            return Math.max(0, oldScrollTop + regionInfo.offsetTop - expectedPosition);
        }));
    }

    // fraction through ref point = (offset + height - refPointOffset) / height
    // position = (fraction through ref point * height) + refPointOffset - height

    // solve the above for fraction through ref point
    function getFractionThroughRefPoint(refPointOffset, regionInfo) {
        var bottom = regionInfo.offsetTop + regionInfo.height;
        var fraction = (bottom - refPointOffset) / regionInfo.height;
        return Math.max(0, Math.min(1, fraction));
    }

    // solve the above for position
    function positionForFractionThroughRefPoint(refPointOffset, fraction, regionInfo) {
        return fraction * regionInfo.height + refPointOffset - regionInfo.height;
    }

    /**
     * Return the region that contains the given y-offset.
     * @param {number} yOffset
     * @param {Array} regionInfos
     * @returns {*} region info
     */
    function getRegionInfoAtYOffset(yOffset, regions) {
        var regionInfo;
        _.some(regions, function (region) {
            // we call getRegionInfo in here, during the iteration so we can do it lazily.
            // if we're at the top of the scroll, we don't have to get info for any regions further down.
            var info = getRegionInfo(region);
            var top = info.offsetTop;
            var height = info.height;
            if (yOffset > top && yOffset <= top + height) {
                regionInfo = info;
                return true;
            }
            return false;
        });
        return regionInfo;
    }

    /**
     * Get all the metadata we need from a region in a cached form for internal use.
     *
     * @param region
     * @returns {{region: Region, offsetTop: number, height: number}}
     */
    function getRegionInfo(region) {
        return {
            region: region,
            offsetTop: region.getOffsetTop(),
            height: region.getHeight()
        };
    }

    /**
     * Get all the metadata we need from a scrollable in a cached form for internal use.
     * @param scrollable
     * @returns {{scrollable: Scrollable, clientHeight: number, scrollHeight: number, scrollTop: number}}
     */
    function getScrollableInfo(scrollable) {
        var info = scrollable.getScrollInfo();
        info = {
            scrollable: scrollable,
            clientWidth: info.clientWidth,
            clientHeight: info.clientHeight,
            scrollWidth: info.width,
            scrollHeight: info.height,
            scrollTop: info.top,
            scrollLeft: info.left,
            canScrollHorizontally: info.clientWidth < info.width,
            canScrollVertically: info.clientHeight < info.height
        };

        // how close to the top and bottom edge, as a fraction of 1/2 the viewable "window" height (arbitrary distance). 1 is "at the edge", 0 is "at least half a screen away"
        // if our screen size is 0, we just use 0 as our topness and bottomness.
        var halfAScreen = info.clientHeight / 2;
        info.topness = halfAScreen ? Math.max(0, (halfAScreen - info.scrollTop) / halfAScreen) : 0;
        info.bottomness = halfAScreen ? Math.max(0, 1 - (info.scrollHeight - (info.scrollTop + info.clientHeight)) / halfAScreen) : 0;

        return info;
    }

    /**
     * Return a scroll handler that will scroll any dependent scrollables in unison.
     *
     * TODO: Try to eat-ERRRIMEAN...*ahem*..."code in"... Bacon. (...JS) FRP-style.
     *
     * @param {Object} options - {@see getScrollHandle.defaults} for details on what options should be passed in.
     */
    function getScrollHandler(options) {
        options = _.extend({}, exports.getScrollHandler.defaults, options);
        var selfOldInfo = getScrollableInfo(options.self);
        // It's possible to get race conditions where the scrollable is "reset" between when the scroll occurs and when it is propagated.
        // For example, this has been seen to occur due to a handler that listens for imagesLoaded and calls .reset()
        // This causes the scroll to appear as a noop since the reset causes the selfOldInfo to appear exactly like the selfInfo.
        // So we freeze the scrollInfo value to the time of the scroll.
        var selfOldInfoAtEnqueueTime;

        var enqueueScrollPropagation = performance.enqueueCapped(requestAnimationFrame, function propagateScroll() {
            var selfInfo = getScrollableInfo(options.self);
            var otherInfos = _.map(options.others, getScrollableInfo);

            var scrollCommands = getSynchedScrollCommands(selfOldInfoAtEnqueueTime, selfInfo, otherInfos, options.getRegions, options.getLinkedRegion, options.focusHeightFraction);

            selfOldInfo = selfInfo;

            if (scrollCommands.length) {
                options.executeCommands(scrollCommands);
            }
        });

        return {
            handle: function handle() {
                if (options.self.getAndUnsetProgrammaticScrollMarker()) {
                    selfOldInfo = getScrollableInfo(options.self); // update our cached data
                    return;
                }
                selfOldInfoAtEnqueueTime = selfOldInfo;
                enqueueScrollPropagation();
            },
            reset: function reset() {
                selfOldInfo = getScrollableInfo(options.self);
            }
        };
    }

    /*
     * Returns a {@link Scrollable} object for use in {@link getScrollHandler}. You don't have to use this to generate a
     * Scrollable - you are free to implement the methods on Scrollable yourself.
     */
    exports.createScrollable = Scrollable;

    /*
     * Returns a {@link Region} object for use in {@link getScrollHandler}. You don't have to use this to generate a
     * Region - you are free to implement the methods on Region yourself.
     */
    exports.createRegion = Region;

    /**
     * Return a scroll handler that will scroll any dependent scrollables in unison.
     * *
     * @param {Object} options - {@see getScrollHandle.defaults} for details on what options should be passed in.
     */
    exports.getScrollHandler = getScrollHandler;

    /**
     * Options for use in {@link getScrollHandler}
     */
    exports.getScrollHandler.defaults = {
        /**
         * A scrollable representing the element to add a scroll handler for.
         *
         * @type {Scrollable}
         */
        self: null,
        /**
         * An array of scrollables that should scroll in unison with this one
         *
         * @type {Scrollable[]}
         */
        others: null,
        /**
         * A function that returns all the regions within a given Scrollable.
         *
         * @type {function(Scrollable): Region[]}
         */
        getRegions: null,
        /**
         * A function that, given Region R and Scrollable S, returns the Region within Scrollable S that should be
         * visible when R is visible.It can be assumed that R is not within S.
         *
         * @type {function(Region, Scrollable): Region}
         */
        getLinkedRegion: null,
        /**
         * The fraction of the way down the visible "window" that we expect users to focus on. The region containing
         * this imaginary 'focus' line will be used for vertical scroll alignment.
         *
         * @type {number}
         */
        focusHeightFraction: 0.5,
        /**
         * A function that will execute an array of scroll commands in the form { scrollable : Scrollable, scrollTop: ?number, scrollLeft : ?number }
         * useful if you need to execute them all together. Otherwise, the default works.
         *
         * @type { function}
         */
        executeCommands: function executeCommands(scrollCommands) {
            _.forEach(scrollCommands, function (cmd) {
                cmd.scrollable.scrollTo(cmd.scrollLeft, cmd.scrollTop);
            });
        }
    };
});