'use strict';

define('bitbucket/internal/feature/file-content/side-by-side-diff-view/synchronized-scroll', ['jquery', 'lodash', 'bitbucket/internal/feature/file-content/diff-view-segment-types', 'bitbucket/internal/util/events', 'bitbucket/internal/util/function', 'bitbucket/internal/util/math', 'bitbucket/internal/util/synchronized-scroll', 'exports'],
/**
 * Builds on {@link util/synchronized-scroll} to define synchronized scrolling functionality for
 * side-by-side diffs.
 *
 * @exports bitbucket/internal/feature/file-content/side-by-side-diff-view/synchronized-scroll
 */
function ($, _, diffViewSegmentTypes, events, fn, math, synchronizedScroll, exports) {

    /**
     * @typedef {Object} SegmentInfo
     * @property {Object} segment - REST segment object
     * @property {LineInfo[]} lineInfos - lineInfos for this segment
     * @property {number} start - start index of this segment in the original line info array
     * @property {number} end - end index of this segment
     * @property {Object} from
     * @property {LineInfo[]} from.lineInfos - lineInfos appearing on the from side
     * @property {number} from.start - starting index of this segment in the 'from' side output
     * @property {number} from.end - ending index of this segment in the 'from' side output
     * @property {Object} to
     * @property {LineInfo[]} to.lineInfos - lineInfos appearing on the to side
     * @property {number} to.start - starting index of this segment in the 'to' side output
     * @property {number} to.end - ending index of this segment in the 'to' side output
     */

    /**
     * Given a list of LineInfos from DiffView, return a list of "SegmentInfo"s for the segments that contain those lines.
     *
     * @param {LineInfo[]} lineInfos - ordered, consecutive LineInfos
     * @returns SegmentInfo[]
     */
    function segmentsFromLineInfos(lineInfos) {
        var prevSegmentInfo = null;
        var index = 0;
        var fromIndex = 0;
        var toIndex = 0;
        var ret = [];
        // push a segment
        function push() {
            if (prevSegmentInfo) {
                prevSegmentInfo.end = index;
                prevSegmentInfo.from.end = fromIndex;
                prevSegmentInfo.to.end = toIndex;
                ret.push(prevSegmentInfo);
            }
        }
        _.forEach(lineInfos, function (lineInfo) {
            if (!prevSegmentInfo || lineInfo.segment !== prevSegmentInfo.segment) {
                push();

                prevSegmentInfo = {
                    segment: lineInfo.segment,
                    lineInfos: [],
                    start: index,
                    end: -1,
                    from: { start: fromIndex, end: -1, lineInfos: [] },
                    to: { start: toIndex, end: -1, lineInfos: [] }
                };
            }

            index++;
            prevSegmentInfo.lineInfos.push(lineInfo);
            if (lineInfo.segment.type !== diffViewSegmentTypes.ADDED) {
                fromIndex++;
                prevSegmentInfo.from.lineInfos.push(lineInfo);
            }
            if (lineInfo.segment.type !== diffViewSegmentTypes.REMOVED) {
                toIndex++;
                prevSegmentInfo.to.lineInfos.push(lineInfo);
            }
        });
        push();
        return ret;
    }

    /**
     * Implements the interface described in util/synchronized-scroll for a {@link Scrollable}
     * @param {*} id - an arbitrary value to identify this scrollable.
     * @param {CodeMirror} editor
     * @constructor
     */
    function CodeMirrorScrollable(id, editor) {
        this._id = id;
        this._editor = editor;
        this._programmatic = false;
    }

    CodeMirrorScrollable.prototype.getScrollInfo = function () {
        return this._editor.getScrollInfo();
    };

    CodeMirrorScrollable.prototype.scrollTo = function (x, y) {
        this._programmatic = this._programmatic || x != null || y != null;
        this._editor.scrollTo(x, y);
    };

    CodeMirrorScrollable.prototype.getAndUnsetProgrammaticScrollMarker = function () {
        var ret = this._programmatic;
        this._programmatic = false;
        return ret;
    };

    /**
     * Implements the interface described in util/synchronized-scroll for a {@link Region}
     *
     * @param {CodeMirror} editor
     * @param {number} startIndex
     * @param {number} endIndex
     * @param {string} id - arbitrary unique string used for linking regions together
     * @param {Object} segment - the diff view segment related to this region
     * @param {Object[]} lineInfos - the list of line infos actually contributing to this region's dimensions. May not match the segment.
     * @constructor
     */
    function CodeMirrorRegion(editor, startIndex, endIndex, id, segment, lineInfos) {
        this._editor = editor;
        this._startIndex = startIndex;
        this._endIndex = endIndex;
        this._numLines = endIndex - startIndex;
        this._id = id;
        this._seg = segment;
        this._cachedInfo = null;
        this._lineInfos = lineInfos;
    }

    CodeMirrorRegion.prototype.getHeight = function () {
        return this._getCachedInfo().height;
    };

    CodeMirrorRegion.prototype.getOffsetTop = function () {
        return this._getCachedInfo().offsetTop - this._editor.getScrollInfo().top;
    };

    /**
     * Internal method to calculate height and offset for this region.
     * The result is cached for future calls until _invalidateCache() is called.
     * @returns {*}
     * @private
     */
    CodeMirrorRegion.prototype._getCachedInfo = function () {
        if (!this._cachedInfo) {
            this._cachedInfo = {
                height: 0,
                offsetTop: this._editor.heightAtLine(this._startIndex, 'local')
            };

            if (!this._numLines) {
                // return 0-height quickly if this is a 'filler' region with no lines in it.
                return this._cachedInfo;
            }

            var endHeight = this._editor.heightAtLine(this._endIndex, 'local');
            this._cachedInfo.height = endHeight - this._cachedInfo.offsetTop;
        }
        return this._cachedInfo;
    };

    /**
     * Forces _getCachedInfo() to recalculate height and offset.
     * @private
     */
    CodeMirrorRegion.prototype._invalidateCache = function () {
        this._cachedInfo = null;
    };

    /**
     * Return a Region that gets its dimensions from other regions - a from and to region.
     * Its height is the max of those other regions.
     *
     * Because we calculate offsets for these using the previous regions, we accept a getOffset() function
     * for calculating how far down we are.
     *
     * To mimic the behavior of real elements, our offset is relative to how far down the parent scrollable is scrolled.
     *
     * @param {Region[]} linkedRegions
     * @param {Function} getOffset
     * @returns {{_id: string, _setCombinedScrollable: Function, getHeight: Function, _getOffset: Function, getOffsetTop: Function, _invalidateCache: Function}}
     */
    function getCombinedRegion(linkedRegions, getOffset) {
        var height;
        var offset;
        var scrollable;
        return {
            _linkedRegions: linkedRegions,
            _seg: linkedRegions[0]._seg,
            _id: 'combined_' + _.pluck(linkedRegions, '_id').join('_'),
            _scrollable: scrollable,
            _setCombinedScrollable: function _setCombinedScrollable(s) {
                scrollable = s;
                this._scrollable = s;
            },
            getHeight: function getHeight() {
                if (height == null) {
                    height = linkedRegions.map(function (region) {
                        return region.getHeight();
                    }).reduce(fn.binary(Math.max), 0);
                }
                return height;
            },
            _getOffset: function _getOffset() {
                if (offset == null) {
                    offset = getOffset();
                }
                return offset;
            },
            getOffsetTop: function getOffsetTop() {
                return this._getOffset() - scrollable._getScrollTop();
            },
            _invalidateCache: function _invalidateCache() {
                height = null;
                offset = null;
            }
        };
    }

    /**
     * Implements {@link util/synchronized-scroll:Scrollable}.
     *
     * This scrollable is a facade in front of nothing. Use it when you want to receive and send scroll events to other
     * scrollables.
     *
     * Currently only deals with vertical scrolling.
     *
     * @param {*} id - an arbitrary value to identify this scrollable;
     * @param {Object} options - configuration for the scrollable
     * @param {Function} options.getScrollHeight - a function that returns the height of the content (i.e., scrollHeight)
     * @param {Function} options.getClientHeight - a function that returns the height of the container (i.e., clientHeight)
     * @param {number} [options.initialScrollTop=0] - the starting scrollTop value for this scrollable.
     * @constructor
     */
    function UnbackedScrollable(id, options) {
        this._id = id;

        var returnZero = fn.constant(0);

        options = $.extend({
            initialScrollTop: 0,
            getClientHeight: returnZero,
            getScrollHeight: returnZero
        }, options);

        var programmatic = false;
        var scrollTop = options.initialScrollTop;
        var scrollHandler;

        var anyScroll = $.Callbacks();

        /**
         * @returns {number}
         */
        this._getScrollTop = function getScrollTop() {
            return math.clamp(0, options.getScrollHeight() - options.getClientHeight())(scrollTop);
        };

        function setScrollTop(y) {
            scrollTop = math.clamp(0, options.getScrollHeight() - options.getClientHeight())(y);
        }

        /**
         * Mimic a native scroll event for this scrollable - trigger the scrollHandler, if set.
         * @param {number} x
         * @param {number} y
         * @private
         */
        this.scrollToNative = function (x, y) {
            // record a user (non-programmatic) scroll
            if (y != null) {
                setScrollTop(y);
                if (scrollHandler) {
                    scrollHandler();
                }
                anyScroll.fire(x, y, 'native');
            }
        };

        /**
         * Set a function to be called on a 'native' scroll (e.g., scrollToNative).
         * @param {Function} sH - a function that will be called whenever this scrollable is scrolled 'natively'
         */
        this._setScrollHandler = function (sH) {
            scrollHandler = sH;
        };

        this.getScrollInfo = function () {
            return {
                top: this._getScrollTop(),
                left: 0,
                height: options.getScrollHeight(),
                width: 0,
                clientHeight: options.getClientHeight(),
                clientWidth: 0
            };
        };

        this.scrollTo = function (x, y) {
            if (y != null) {
                programmatic = true;
                setScrollTop(y);
                anyScroll.fire(x, y, 'sync');
            }
        };

        this.on = function (event, fn) {
            if (event === 'scroll') {
                anyScroll.add(fn);
            }
        };

        this.getAndUnsetProgrammaticScrollMarker = function () {
            var ret = programmatic;
            programmatic = false;
            return ret;
        };
    }

    /**
     * Given a list of LineInfo objects, form regions for each editor (from and to) based on the segments they comprise.
     *
     * Return the regions, as well as information about which regions are "linked" across the editors (list form: linkedFromAndToRegions,
     * or lookup form: linkedRegionsByRegionId)
     *
     * The option `includeCombinedRegions` can be used to additionally return a third set of regions that combines the `from` set and the `to` set.
     * If included, these regions will be added to the "linked" list & map as well.
     *
     * The regions will be initialized to listen for updates and invalidate their cached values when necessary. Therefore,
     * you must call `destroy()` when you are done using them to avoid memory leaks.
     *
     * @param {SideBySideDiffView} diffView
     * @param {LineInfo[]} lineInfos
     * @param {CodeMirror} fromEditor
     * @param {CodeMirror} toEditor
     * @param {Object} options
     * @returns {{fromRegions: Array, toRegions: Array, combinedRegions: *, linkedFromAndToRegions: *, linkedRegionsByRegionId: {}, destroy: Function}}
     */
    function getRegionsFromLineInfos(diffView, lineInfos, fromEditor, toEditor, options) {
        var fromRegions = [];
        var toRegions = [];

        function createRegion(editor, range, segment, lineInfos, idPrefix) {
            return new CodeMirrorRegion(editor, range.start, range.end, idPrefix + '_' + range.start + '_' + range.end, segment, lineInfos);
        }

        /**
         * Take in two segmentInfos - one whose `from` side we'll use and one whose `to` side we'll use.
         * We'll turn each of those into regions and link them together, so the `from` and `to` sides are
         * scrolled at the same time.
         *
         * @param {SegmentInfo} fromSegmentInfo
         * @param {SegmentInfo} toSegmentInfo
         */
        function addLinkedRegions(fromSegmentInfo, toSegmentInfo) {
            var fromRegion = createRegion(fromEditor, fromSegmentInfo.from, fromSegmentInfo.segment, fromSegmentInfo.from.lineInfos, 'from');
            var toRegion = createRegion(toEditor, toSegmentInfo.to, toSegmentInfo.segment, toSegmentInfo.to.lineInfos, 'to');

            fromRegions.push(fromRegion);
            toRegions.push(toRegion);
        }

        var segmentsList = segmentsFromLineInfos(lineInfos);
        var prevRemovedSegment = _.reduce(segmentsList, function (prevRemovedSegment, segmentInfo) {
            if (prevRemovedSegment && segmentInfo.segment.type === diffViewSegmentTypes.ADDED) {
                addLinkedRegions(prevRemovedSegment, segmentInfo);
                return null;
            }
            if (prevRemovedSegment) {
                addLinkedRegions(prevRemovedSegment, prevRemovedSegment);
            }
            if (segmentInfo.segment.type === diffViewSegmentTypes.REMOVED) {
                return segmentInfo;
            }

            addLinkedRegions(segmentInfo, segmentInfo);
            return null;
        }, null);

        if (prevRemovedSegment) {
            addLinkedRegions(prevRemovedSegment, prevRemovedSegment);
        }

        var toAndFromRegions = _.zip(fromRegions, toRegions);

        /**
         * @function
         * @param {Region[]} allRegions - all regions, in order
         * @param {number} index - the index at which to obtain the offset
         * @returns {number} - offset in px
         */
        var getOffsetAtIndex = _.compose(fn.partialRight(_.reduce, math.add, 0), // = sum of
        fn.partialRight(_.invoke, 'getHeight'), // = the heights
        _.take); // = of the first `index` elements

        var combinedRegions = options.includeCombinedRegions ? _.reduce(toAndFromRegions, function (combinedRegions, fromToRegions, regionIndex) {
            var getOffset = _.partial(getOffsetAtIndex, combinedRegions, regionIndex);

            combinedRegions.push(getCombinedRegion(fromToRegions, getOffset));
            return combinedRegions;
        }, []) : [];

        var linkedRegionsCache = {};
        if (combinedRegions.length) {
            _.chain(fromRegions).zip(toRegions, combinedRegions).forEach(fn.spread(function (fromRegion, toRegion, combinedRegion) {
                linkedRegionsCache[fromRegion._id] = [toRegion, combinedRegion];
                linkedRegionsCache[toRegion._id] = [fromRegion, combinedRegion];
                linkedRegionsCache[combinedRegion._id] = [fromRegion, toRegion];
            })).value();
        } else {
            _.forEach(toAndFromRegions, fn.spread(function (fromRegion, toRegion) {
                linkedRegionsCache[fromRegion._id] = [toRegion];
                linkedRegionsCache[toRegion._id] = [fromRegion];
            }));
        }

        function invalidate(regions) {
            return _.invoke.bind(_, regions, '_invalidateCache');
        }

        fromEditor.on('change', invalidate(fromRegions.concat(combinedRegions)));
        toEditor.on('change', invalidate(toRegions.concat(combinedRegions)));
        var invalidateAll = invalidate(fromRegions.concat(toRegions, combinedRegions));
        $(window).on('resize', invalidateAll);
        diffView.on('widgetAdded', invalidateAll);
        diffView.on('widgetChanged', invalidateAll);
        diffView.on('widgetCleared', invalidateAll);
        diffView.on('internal.acceptedModification', invalidateAll);

        var boundEvents = events.chain().on('bitbucket.internal.feature.commit.difftree.collapseAnimationFinished', invalidateAll);

        return {
            combinedSegments: segmentsList,
            fromRegions: fromRegions,
            toRegions: toRegions,
            combinedRegions: combinedRegions,
            linkedFromAndToRegions: toAndFromRegions,
            linkedRegionsByRegionId: linkedRegionsCache,
            destroy: function destroy() {
                boundEvents.destroy();
                $(window).off('resize', invalidateAll);
            }
        };
    }

    /**
     * Given some Scrollables and region information, create scroll event listeners for each one that will cause
     * synchronized scrolls in the other Scrollables.
     *
     * @param {SideBySideDiffView} diffView
     * @param {Scrollable} fromScrollable
     * @param {Scrollable} toScrollable
     * @param {Scrollable} combinedScrollable
     * @param {Object} regionData - output from getRegionsFromLineInfos
     * @param {Object} options
     * @returns {{fromHandler: Function, toHandler: Function, combinedHandler: ?Function}}
     */
    function getSynchronizedScrollHandlers(diffView, fromScrollable, toScrollable, combinedScrollable, regionData, options) {
        var regionsByScrollableId = {};
        regionsByScrollableId[fromScrollable._id] = regionData.fromRegions;
        regionsByScrollableId[toScrollable._id] = regionData.toRegions;
        if (combinedScrollable) {
            regionsByScrollableId[combinedScrollable._id] = regionData.combinedRegions;
        }

        /**
         * Given a scrollable, return the list of regions in that scrollable
         * @function
         * @param {Scrollable} scrollable
         * @returns {CodeMirrorRegion[]}
         */
        var getRegionsForScrollable = _.compose(fn.lookup(regionsByScrollableId), fn.dot('_id'));

        /**
         * Given a region, return the list of regions that are linked to it.
         * @function
         * @param {CodeMirrorRegion} region
         * @returns {CodeMirrorRegion[]}
         */
        var getLinkedRegionsForRegion = _.compose(fn.lookup(regionData.linkedRegionsByRegionId), fn.dot('_id'));

        /**
         * Get a region in the provided scrollable that is linked to the region provided
         *
         * @param {CodeMirrorRegion} region - region to find linked regions for
         * @param {Scrollable} scrollable - the scrollable in which we want to find a linked region
         * @returns {CodeMirrorRegion}
         */
        function getLinkedRegion(region, scrollable) {
            var linkedRegions = getLinkedRegionsForRegion(region) || [];
            return _.find(linkedRegions, fn.dotEq('_editor', scrollable._editor));
        }

        /**
         * @param {{scrollable : *, scrollLeft: *, scrollTop : *}} cmd
         */
        function executeCommand(cmd) {
            cmd.scrollable.scrollTo(cmd.scrollLeft, cmd.scrollTop);
        }

        /**
         * Execute any scroll commands from synched scrolling within a CodeMirror operation.
         * @param {{scrollable : *, scrollLeft: *, scrollTop : *}} commands
         */
        function executeScrollCommands(commands) {
            diffView.operation(_.forEach.bind(_, commands, executeCommand));
            diffView.trigger('sync-scroll');
        }

        /**
         *
         * @param {Scrollable} self - create a handler for this scrollable
         * @param {Scrollable[]} others - scrollables to be updated
         * @param {Object} options
         * @param {boolean} options.includeHorizontal - whether we should accept horizontal scrolls from this scrollable
         * @returns {Object} scroll handler
         */
        function getHandler(self, others, options) {
            var execute;
            if (options.includeHorizontal) {
                execute = executeScrollCommands;
            } else {
                var ignoreScrollLeftInCommands = fn.partialRight(_.map, fn.unary( // for each item (ignoring map's index argument)
                fn.partialRight(_.omit, 'scrollLeft') // omit the scrollLeft property
                ));
                execute = _.compose(executeScrollCommands, ignoreScrollLeftInCommands);
            }
            return synchronizedScroll.getScrollHandler({
                self: self,
                others: others,
                getRegions: getRegionsForScrollable,
                getLinkedRegion: getLinkedRegion,
                executeCommands: execute,
                focusHeightFraction: options.focusHeightFraction
            });
        }

        var handlerOptions = {
            includeHorizontal: true,
            focusHeightFraction: options.focusHeightFraction
        };

        var handlers = {
            fromHandler: getHandler(fromScrollable, _.compact([toScrollable, combinedScrollable]), handlerOptions),
            toHandler: getHandler(toScrollable, _.compact([fromScrollable, combinedScrollable]), handlerOptions)
        };

        if (combinedScrollable) {
            handlers.combinedHandler = getHandler(combinedScrollable, [fromScrollable, toScrollable], {
                includeHorizontal: false,
                focusHeightFraction: options.focusHeightFraction
            });
        }

        return handlers;
    }

    /**
     * Link up the "from" and "to" views so that they scroll their partner file to the appropriate location when scrolled.
     *
     * If options.includeCombinedScrollable is true, a third scrollable will be added to the mix that you can manually
     * call scroll commands on to
     *
     * Get information about the linked regions between the "from" and "to" files, and
     *
     * @param {SideBySideDiffView} diffView
     * @param {LineInfo[]} lineInfos
     * @param {CodeMirror} fromEditor
     * @param {CodeMirror} toEditor
     * @param {Object} [options]
     * @param {boolean} [options.includeCombinedScrollable=false] - whether to return a scrollable you can interact with
     *                                                              to scroll both sides in a unfied way.
     * @returns {Object}
     */
    function setupScrolling(diffView, lineInfos, fromEditor, toEditor, options) {
        options = options || {};

        var regions = getRegionsFromLineInfos(diffView, lineInfos, fromEditor, toEditor, {
            includeCombinedRegions: options.includeCombinedScrollable
        });

        var fromScrollable = new CodeMirrorScrollable('from', fromEditor);
        var toScrollable = new CodeMirrorScrollable('to', toEditor);

        var combinedScrollableHeight = 0;
        var combinedScrollable;
        if (options.includeCombinedScrollable) {
            combinedScrollable = new UnbackedScrollable('combined', {
                getScrollHeight: function getScrollHeight() {
                    return _.chain(regions.combinedRegions).invoke('getHeight').reduce(math.add, 0).value();
                },
                getClientHeight: function getClientHeight() {
                    return combinedScrollableHeight;
                }
            });
        }

        var synchronizedScrollHandlers = getSynchronizedScrollHandlers(diffView, fromScrollable, toScrollable, combinedScrollable, regions, options);
        fromEditor.on('scroll', synchronizedScrollHandlers.fromHandler.handle);
        toEditor.on('scroll', synchronizedScrollHandlers.toHandler.handle);

        var synchronizedScrollingInfo = {
            combinedSegments: regions.combinedSegments,
            combinedRegions: regions.combinedRegions,
            combinedScrollable: combinedScrollable,
            linkedFromAndToRegions: regions.linkedFromAndToRegions,
            destroy: function destroy() {
                fromEditor.off('scroll', synchronizedScrollHandlers.fromHandler.handle);
                toEditor.off('scroll', synchronizedScrollHandlers.toHandler.handle);
                regions.destroy();
            }
        };

        if (combinedScrollable) {
            combinedScrollable._setScrollHandler(synchronizedScrollHandlers.combinedHandler.handle);
            combinedScrollable.setClientHeight = function (h) {
                combinedScrollable.clientHeight = h;
                combinedScrollableHeight = h;
                synchronizedScrollHandlers.combinedHandler.reset();
            };
            _.invoke(regions.combinedRegions, '_setCombinedScrollable', combinedScrollable);
            synchronizedScrollingInfo.combinedScrollable = combinedScrollable;
        }

        var resetScrolls = _.invoke.bind(_, synchronizedScrollHandlers, 'reset');

        diffView.on('widgetCleared', resetScrolls);
        diffView.on('widgetChanged', resetScrolls);
        diffView.on('widgetAdded', resetScrolls);
        return synchronizedScrollingInfo;
    }

    exports.setupScrolling = setupScrolling;
});