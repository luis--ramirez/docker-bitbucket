'use strict';

// WARNING: This module id replaces a removed older version of DiffView.
// It is a completely different module since 2.11.
// Plugin developers should not have been depending on the old one
// and should not depend on this one either.

define('bitbucket/internal/feature/file-content/diff-view', ['jquery', 'lodash', 'bitbucket/internal/feature/comments/anchors', 'bitbucket/internal/feature/file-content/diff-view-options', 'bitbucket/internal/feature/file-content/diff-view-segment-types', 'bitbucket/internal/feature/file-content/ediff/ediff-markers', 'bitbucket/internal/feature/file-content/text-view', 'bitbucket/internal/model/direction', 'bitbucket/internal/util/array', 'bitbucket/internal/util/events', 'bitbucket/internal/util/function', 'bitbucket/internal/util/navigator', 'bitbucket/internal/util/object', 'bitbucket/internal/util/shortcuts'],
/**
 * An abstract class used by Unified Diff View and Side-by-side Diff View for rendering code changes.
 *
 * Uses CodeMirror heavily.
 *
 * @exports bitbucket/internal/feature/file-content/diff-view
 */
function ($, _, Anchors, diffViewOptions, diffViewSegmentTypes, ediffMarkers, TextView, Direction, array, events, fn, navigator, obj, shortcuts) {
    'use strict';

    var ADDED = diffViewSegmentTypes.ADDED;
    var REMOVED = diffViewSegmentTypes.REMOVED;
    var CONTEXT = diffViewSegmentTypes.CONTEXT;

    /**
     * A public change object will contain some, but not all of the properties from a {@link ContentChange}
     *
     * @typedef {Object} PublicChange
     * @property {string} type - 'INITIAL' for the initial load, and 'INSERT' for expanded contexts. Other values may be added in the future for other types of change.
     * @property {Object} diff
     */

    /**
     * Will combine two arrays of segments into a single one, in file order.
     *
     * @param {Object[]} segments - The current segments list
     * @param {Object[]} newSegments - The newly added segments
     * @returns {Object[]} - The updated segments list
     */
    function mergeSegments(segments, newSegments) {
        return segments.concat(newSegments).sort(function (segA, segB) {
            var af = _.first(segA.lines);
            var bf = _.first(segB.lines);
            var al = _.last(segA.lines);
            var bl = _.last(segB.lines);
            return af.destination - bf.destination || af.source - bf.source || al.destination - bl.destination || al.source - bl.source;
        });
    }

    /**
     * Get all the segments from a diff object.
     *
     * @param {Object} diff
     * @returns {Object[]}
     * @private
     */
    function getSegmentsFromDiff(diff) {
        return _.chain(diff.hunks).pluck('segments').flatten(true).value();
    }

    /**
     * Return whether a region contains modification lines.
     *
     * @param {Object} segment
     * @returns {boolean}
     * @private
     */
    function isModification(segment) {
        return segment && segment.type !== diffViewSegmentTypes.CONTEXT;
    }

    /**
     * Return whether a segment contains a conflict
     *
     * @param {Object} segment
     * @returns {boolean}
     * @private
     */
    function isConflicted(segment) {
        return Boolean(segment.lines[0].conflictMarker);
    }

    // Cloning these elements and doing DOM manip seems to be faster than using Soy templates directly for each line.
    var $lineNumber = $(bitbucket.internal.feature.fileContent.diffView.lineNumber());
    var $lineNumberMarker = $(bitbucket.internal.feature.fileContent.diffView.lineNumberMarker());

    /**
     * Add line numbers to the editor's gutter
     *
     * @param {DiffView} diffView - needs to be explicitly passed in so we can trigger events (the change only exposes the API)
     * @param {ContentChange} change
     */
    function addLineNumbers(diffView, change) {
        var gutterMarkerArgs = [];
        return change.eachLine(function (data) {
            var line = data.line;
            var FROM = data.handles.FROM;
            var TO = data.handles.TO;

            var $fromClone = $lineNumber.clone();
            var $toClone = $lineNumber.clone();
            $fromClone.addClass('line-number-from');
            $toClone.addClass('line-number-to');
            $fromClone.html(data.lineType !== ADDED ? line.source : '&nbsp;');
            $toClone.html(data.lineType !== REMOVED ? line.destination : '&nbsp;');

            gutterMarkerArgs.push([FROM || TO, 'line-number-from', $fromClone[0]]);
            gutterMarkerArgs.push([TO || FROM, 'line-number-to', $toClone[0]]);

            data.handles.all.forEach(function (h) {
                var $marker = $lineNumberMarker.clone();
                $marker.attr('data-file-type', h.fileType);
                $marker.attr('data-line-type', data.lineType);
                $marker.attr('data-line-number', data.lineNumber);
                $marker.html(h.lineType === ADDED ? '+' : h.lineType === REMOVED ? '-' : '&nbsp;');

                gutterMarkerArgs.push([h, 'line-number-marker', $marker[0]]);
            });
        }).done(function () {
            diffView.operation(function () {
                gutterMarkerArgs.forEach(function (args) {
                    diffView.setGutterMarker.apply(diffView, args);
                });
            });

            diffView._$container.addClass('fully-loaded diff-api-ready');

            // fire the change event only once the lines are loaded.
            // This is necessary because we can't reliably address lines until the markers are rendered.
            var publicChange = getPublicChange(change);
            triggerPublicChange(diffView, publicChange);
            if (change.type === 'INITIAL') {
                triggerPublicLoad(diffView, publicChange);
            }
        });
    }

    var classes = {};
    classes[ADDED] = 'added';
    classes[REMOVED] = 'removed';
    classes[CONTEXT] = 'context';

    /**
     * Get CSS classes to apply to a line
     * @param {string} lineType - DiffViewSegmentType
     * @param {string} conflictMarker
     * @param {boolean} isInsert - non-standard line
     * @param {boolean} isExpanded - expanded context (e.g. non-relevant context in side-by-side)
     * @returns {string}
     */
    function getLineClasses(lineType, conflictMarker, isInsert, isExpanded) {
        var cssClass = classes[lineType];

        if (lineType !== CONTEXT) {
            cssClass += ' modified';
        }
        if (isExpanded === true || isInsert === true) {
            cssClass += ' expanded';
        }
        cssClass += conflictMarker ? ' conflict conflict-' + conflictMarker.toLowerCase() : '';
        // Also add a 'new' class when we're expanding context
        cssClass += isInsert ? ' new' : '';
        return cssClass;
    }

    /**
     * Add the Diff classes to the editor based on the given diff information
     *
     * @param {DiffView} diffView
     * @param {ContentChange} change
     */
    function addDiffClasses(diffView, change) {
        var isInsert = change.type === 'INSERT';

        var affectedLines = [];
        change.eachLine(function (lineData) {
            var classes = getLineClasses(lineData.lineType, lineData.line.conflictMarker, isInsert, lineData.attributes.expanded);
            lineData.handles.all.forEach(function (handle) {
                diffView.addLineClass(handle, 'wrap', classes);
                if (isInsert) {
                    affectedLines.push(handle);
                }
            });
        }).done(function () {
            // We've been hanging on to the line handles so we can use them to remove the new class after a timeout.
            if (affectedLines.length) {
                removeNewClass(diffView, affectedLines);
            }
        });
    }

    /**
     * Remove the 'new' class from freshly inserted lines
     *
     * @param {DiffView} diffView
     * @param {Array.LineHandle} lines - an array of CodeMirror Line Handles
     */
    function removeNewClass(diffView, lines) {
        setTimeout(function () {
            if (!diffView._editor) {
                // we were destroyed in the meantime
                return;
            }
            diffView.operation(function () {
                _.each(lines, function (line, index) {
                    diffView.removeLineClass(line, 'wrap', 'new');
                });
            });
        }, 1500);
    }

    /**
     * Get a public change object for editor change/load events
     *
     * @param {ChangeObject} change
     * @returns {PublicChange}
     */
    function getPublicChange(change) {
        var clone = $.extend({}, change);
        delete clone.fileChange;
        return obj.freeze(clone);
    }

    /**
     * Trigger a public change event
     *
     * @param {DiffView} diffView
     * @param {PublicChange} change
     */
    function triggerPublicChange(diffView, change) {
        diffView.trigger('change', change);
        events.trigger('bitbucket.internal.feature.fileContent.diffViewContentChanged', null, change);
    }

    /**
     * Trigger a public load event
     *
     * @param {DiffView} diffView
     * @param {PublicChange} change
     */
    function triggerPublicLoad(diffView, change) {
        diffView.trigger('load', change);
        events.trigger('bitbucket.internal.feature.fileContent.diffViewContentLoaded', null, change);
    }

    /**
     * Abstract class for viewing diffs.
     *
     * @param {Object} data
     * @param {Object} options
     * @constructor
     */
    function DiffView(data, options) {
        TextView.call(this, options.$container, options);
        this._data = data;
        this._scrollingReady = $.Deferred();
    }
    obj.inherits(DiffView, TextView);
    DiffView.defaults = TextView.defaults;

    /**
     * How content has been changed
     * @enum {string} ContentChangeType
     */
    DiffView.contentChangeType = {
        /** This is the initial load of the content. */
        INITIAL: 'INITIAL',
        /** New lines are being inserted into the content. */
        INSERT: 'INSERT'
    };

    /**
     * Initialize the DiffView
     */
    DiffView.prototype.init = function () {
        TextView.prototype.init.call(this);
        var dvOptions = this._options.diffViewOptions || diffViewOptions;
        var showAnimations = !navigator.isIE() || navigator.majorVersion() >= 11;

        this.registerGutter('line-number-marker', { weight: 1000 });

        this._$container.addClass('diff-type-' + this._options.fileChange.type).toggleClass('hide-ediff', dvOptions.get('hideEdiff')).toggleClass('animated', showAnimations);
        // This is normally toggled by feature-detect.js and only disabled on IE9.
        // Because the diff view has so many elements it often fails on IE10 we don't enable animations on IE10, but we
        // also need to explicitly disable them for the fallback CSS to activate.
        $('html').toggleClass('no-cssanimations', !showAnimations);

        var self = this;

        events.trigger('bitbucket.internal.feature.fileContent.diffViewDataLoaded', null, this._data);

        // Set us up some event handlers for all the things.
        this.on('internal-change', function (change) {
            addLineNumbers(self, change).done(function () {
                self._selectLine(self._options.anchor);
                var search = self._options.fileChange.search;
                // Don't do anything if no search specified (only on load though - otherwise we might want to clear)
                if (search) {
                    self._highlight(search);
                }
            });
        });

        this._addDestroyable(ediffMarkers.init({ diffView: this }));
        this._addDestroyable(events.chainWith($(window)).on('scroll', function () {
            if (!self._expectFocusScroll) {
                // if we weren't expecting the window to scroll
                // blur our tracked focus
                self._invalidateFocus();
            }
            // always stop expecting a scroll
            self._expectFocusScroll = false;
        }));
        this._addDestroyable(events.chainWith(dvOptions).on('change', function (change) {
            if (change.key === 'hideEdiff') {
                self._$container.toggleClass('hide-ediff', change.value);
            }
        }));

        this.on('internal.acceptedModification', fn.spread(function (changeType, newContentJSON, newContentLineInfos) {
            // hack so classes are added synchronously.
            // We need classes on our elements upfront because they affect sizing of the lines and can get things out of
            // whack if they aren't immediately present.
            // They are also much faster to add than the line numbers are.
            addDiffClasses(this, {
                type: changeType,
                eachLine: function eachLine(fn) {
                    return $.Deferred().resolve(_.map(newContentLineInfos, fn));
                }
            });
        }));

        if (this._options.attachScroll) {
            // Deferred so file-content-spinner is removed before any heights are calculated.
            _.defer(function () {
                self._attachScrollBehavior().then(self._scrollingReady.resolve.bind(self._scrollingReady), self._scrollingReady.reject.bind(self._scrollingReady));
            });
        } else {
            // instantly resolve it because we don't need scrolling
            this._scrollingReady.resolve();
        }

        this._addDestroyable(events.chain().on('bitbucket.internal.feature.diffView.lineChange', this._selectLine.bind(this)).on('bitbucket.internal.feature.diffView.highlightSearch', this._highlight.bind(this)));

        this._addDestroyable(shortcuts.bind('requestSecondaryNext', this._scrollToChange.bind(this, Direction.DOWN)));
        this._addDestroyable(shortcuts.bind('requestSecondaryPrevious', this._scrollToChange.bind(this, Direction.UP)));
    };

    function abstractMethod() {
        throw new Error("DiffView implementation must define this.");
    }

    /**
     * Find the next segment in the list of segments for the current diff.
     *
     * @private
     *
     * @param {Object} focusSegment - the segment that currently has visual focus
     * @param {Object[]} segments - All the segments for the current diff
     * @param {Direction} direction - the direction in which we want to find the next segment
     * @returns {Object} new focus segment
     */
    DiffView.prototype._findNextChange = function (focusSegment, segments, direction) {
        var self = this;
        var foundCurrentFocus = false;

        var nextChangeIndex = -1;

        // if nothing has focus, we start from the top
        if (focusSegment == null) {
            direction = Direction.DOWN;
            foundCurrentFocus = true;
        }
        var n;
        var len = segments.length;
        for (n = 0; n < len; n++) {
            var i = direction === Direction.DOWN ? n : len - n - 1;
            var segment = segments[i];
            if (foundCurrentFocus) {
                var prevSegment = segments[i - 1];
                // only mods are focusable
                var isNextChange = isModification(segment) &&
                // conflicted segments are combined, so we only care about the first.
                !(isConflicted(segment) && prevSegment && isConflicted(prevSegment)) &&
                // if we're combining mods, we only care about the first
                !(self._options.combineLinkedSegments && prevSegment && isModification(prevSegment));

                if (isNextChange) {
                    nextChangeIndex = i;
                    break;
                }
            } else if (segment === focusSegment) {
                foundCurrentFocus = true;
            }
        }

        // should a segment be included in the list of focus segments (assuming the previous segment was included.
        function shouldAppendToFocus(segment) {
            // always include sibling conflicts
            // include sibling modifications only if we're combining segments
            return isConflicted(segment) || self._options.combineLinkedSegments && isModification(segment);
        }

        if (nextChangeIndex > -1) {
            // we found it! Now we collect all the following changes that will be included in the focus
            var startInclusive = nextChangeIndex;
            var endExclusive = nextChangeIndex + 1;

            while (endExclusive < segments.length && shouldAppendToFocus(segments[endExclusive])) {
                endExclusive++;
            }
            return segments.slice(startInclusive, endExclusive);
        }

        return null;
    };

    /**
     * Focus a line based on a line number and its type.
     * @param {{no: number, type: string}=} line - type is either 'FROM' or 'TO'
     */
    DiffView.prototype._selectLine = function (line) {
        if (!line) {
            return;
        }

        var lineHandle = this.getLineHandleFromNumber(line.no, line.type);

        if (lineHandle) {
            this.scrollHandleIntoFocus(lineHandle);
            this._markLinesFocused([{ editor: this._editorForHandle(lineHandle), handles: [lineHandle] }]);
        }
    };

    /**
     * Scroll the diff to the next or previous change segment, given a direction.
     * @param {Direction} direction
     * @protected
     */
    DiffView.prototype._scrollToChange = function (direction) {
        var currFocus = this._focusedSegments && this._focusedSegments[0];
        if (!currFocus) {
            var expectedDiffViewOffset = this._$fileToolbar.outerHeight(); // the toolbar stays on screen.
            var extraOffset = this._$container[0].getBoundingClientRect().top - expectedDiffViewOffset;
            currFocus = this._getFocusSegment(extraOffset);
        }

        var newFocusSegments = this._findNextChange(currFocus, this._allSegments, direction);
        if (newFocusSegments) {
            this._setFocusSegment(newFocusSegments);
            this._expectFocusScroll = true;
            this._focusedSegments = newFocusSegments;
        }
    };

    /**
     * Scroll to the next comment in a given direction from the current focus
     *
     * @param {Direction} direction
     * @private
     */
    DiffView.prototype._scrollToComment = function (direction) {
        // make sure that comments are not hidden when navigating them.
        diffViewOptions.set('hideComments', false);

        var anchors = _.chain(this._options.commentContext._containers).pluck('anchor').filter(function (anchor) {
            return anchor instanceof Anchors.LineAnchor;
        }).uniq(fn.invoke('getId')).value();
        var nextAnchorInfo = this._findNextAnchor(direction, anchors, this._focusedComment);

        if (!nextAnchorInfo) {
            return;
        }

        this._expectFocusScroll = true;
        this._focusedComment = nextAnchorInfo;

        // scroll to the first file comment
        if (!nextAnchorInfo.handle) {
            this._scrollToSourcePosition(null, -this._editorInnerOffset());
            return;
        }

        this._highlightCommentForLine(nextAnchorInfo.handle);
        this.scrollHandleIntoFocus(nextAnchorInfo.handle);
    };

    DiffView.prototype._invalidateFocus = function () {
        this._focusedSegments = null;
        this._focusedComment = null;
    };

    function getAnchorInfo(editor, lineLookup, anchor) {
        var handle;
        if (anchor._line !== undefined) {
            var handles = lineLookup[anchor._lineType][anchor._line].handles;
            handle = handles[anchor._fileType] || handles.FROM || handles.TO;
        }
        return {
            anchor: anchor,
            handle: handle,
            offset: handle ? editor.heightAtLine(handle._handle.lineNo(), 'local') : 0
        };
    }

    /**
     * Used by the _findNextAnchor implementations
     *
     * @param {CodeMirror} editor - the editor containing anchors
     * @param {Array<Object>} anchors - a list of unique comment anchors within the given editor
     * @param {Direction} direction - which direction to search
     * @param {?{anchor : Object, handle ?Object, offset : number}} focusedAnchorInfo - info about the anchor that is currently focused
     * @returns {?{anchor : Object, handle ?Object, offset : number}}
     * @private
     */
    DiffView.prototype._findNextAnchorInEditor = function (editor, anchors, direction, focusedAnchorInfo) {
        if (anchors.length === 0) {
            return null;
        }

        anchors = _.sortBy(anchors, fn.dot('_line'));

        // If we have a focus anchor in the list, we don't have to get pixel offsets for the anchors,
        // we only have to order them by relative index - perf optimization
        if (focusedAnchorInfo) {
            var focusIndex = array.findIndex(fn.propEqual(_.pick(focusedAnchorInfo.anchor, '_line', '_lineType', '_fileType')))(anchors);
            if (focusIndex !== -1) {
                // if moving up, we want the one before our current anchor.
                // if moving down, we want the one after our current anchor.
                var nextAnchor = anchors[focusIndex + (direction === Direction.UP ? -1 : 1)];
                return nextAnchor && getAnchorInfo(editor, this._internalLines, nextAnchor);
            }
        }

        // we don't have an anchor or the anchor isn't in our list, so we have to use offsets
        var currentFocusOffset;
        if (focusedAnchorInfo) {
            currentFocusOffset = focusedAnchorInfo.offset;
        } else {
            var expectedDiffViewOffset = this._$fileToolbar.outerHeight(); // the toolbar stays on screen.
            var extraOffset = this._$container[0].getBoundingClientRect().top - expectedDiffViewOffset;
            var scrollInfo = editor.getScrollInfo();
            currentFocusOffset = scrollInfo.top + this._options.focusPoint * scrollInfo.clientHeight - extraOffset;
        }

        var infos = anchors.map(getAnchorInfo.bind(null, editor, this._internalLines));

        if (direction === Direction.UP) {
            return _.find(infos.reverse(), function (info) {
                return info.offset < currentFocusOffset;
            });
        } else {
            return _.find(infos, function (info) {
                return info.offset > currentFocusOffset;
            });
        }
    };

    /**
     * Highlight a comment inside of a line for the given line handle
     * @param {StashLineHandle} stashLineHandle
     * @private
     */
    DiffView.prototype._highlightCommentForLine = function (stashLineHandle) {
        this._markLineCommentsFocused([{ editor: this._editorForHandle(stashLineHandle), handles: [stashLineHandle] }]);
    };

    /**
     * Retrieve a handle for a given line number and its type.
     *
     * @param {number} lineNumber
     * @param {string} fileType - either 'FROM' or 'TO'
     * @returns {StashLineHandle} an object describing the line that can be used to interact with the diff.
     */
    DiffView.prototype.getLineHandleFromNumber = function (lineNumber, fileType) {
        var handles = fileType === 'TO' ? this._internalLines[ADDED][lineNumber] : this._internalLines[REMOVED][lineNumber];
        var searchProp = fileType === 'TO' ? 'line.destination' : 'line.source';
        // Search for context last, which could be on either side
        // Unfortunately if the line is context then we have to find it manually - the index of _internalLines is based on the source
        handles = handles || _.find(this._internalLines[CONTEXT], fn.dotEq(searchProp, lineNumber));
        handles = handles && handles.handles;
        return handles && (handles[fileType] || handles.all[0]);
    };

    /**
     * Will be called when a request to modify the diff is received (e.g. during init() or when context is expanded).
     *
     * MUST inject/remove text in CodeMirror editor(s). Can assume you're being called within an operation().
     * MUST make successive calls to {@link LineInfo:_setHandle} for each new line. CONTEXT lines should call _setHandle twice, once for each fileType ('FROM' or 'TO')
     *
     * @abstract
     * @function
     * @param {string} changeType
     * @param {Object} diff
     * @param {Array<StashLineInfo>} lines
     * @protected
     */
    DiffView.prototype._acceptModification = abstractMethod;

    /**
     * Get all the lines from an array of internal line datas and create a newline separated string.
     *
     * @param {Array.LineInfo} lineInfos
     * @returns {string}
     * @protected
     */
    DiffView._combineTexts = function (lineInfos) {
        return _.chain(lineInfos).pluck('line').pluck('line').value().join('\n');
    };

    DiffView.prototype._getChangeAttributes = function (changeType, diff) {
        return {
            diff: diff,
            fileChange: this._options.fileChange
        };
    };

    DiffView.prototype._getLineClasses = getLineClasses;

    /**
     * Begin a request for content to be added to the view.
     *
     * @param {Object} diff - diff object shaped like our REST models
     * @param {string} changeType - INITIAL or INSERT
     * @param {*} ...args - additional arguments are passed into _acceptModification
     * @protected
     */
    DiffView.prototype._modifyDiff = function (changeType, diff, lineInfos /*, args*/) {
        var args = [].slice.call(arguments, 3);

        // keep track of segments for segment nav purposes.
        this._allSegments = mergeSegments(this._allSegments || [], getSegmentsFromDiff(diff));

        this._modify.apply(this, [changeType, diff, lineInfos].concat(args));
    };

    /**
     * Handles the animation applied to a number of lines across potentially multiple editors/handles (eg. side-by-side).
     *
     * @param {string} className - stays until {ms} milliseconds have passed
     * @param {string} classNameUntilReplaced - this classname stays "forever", useful for func tests
     * @param {number} ms
     * @param {{editor: {CodeMirror}, handles: StashLineHandle[]}} editorsAndHandles
     */
    function addAnimationLineClass(className, classNameUntilReplaced, ms, editorsAndHandles) {
        var self = this;

        // Cancel previous animations (if any)
        if (!this._currAnimationPromise) {
            this._currAnimationPromise = {};
        }
        if (this._currAnimationPromise[className]) {
            _.invoke(this._currAnimationPromise[className], 'abort');
        }
        this._currAnimationPromise[className] = editorsAndHandles.map(function (args) {
            var handles = args.handles;
            var editor = args.editor;
            if (!handles || !handles.length) {
                return $.Deferred().reject().promise({
                    abort: $.noop
                });
            }

            function toggleClasses(add, className) {
                var method = add ? 'addLineClass' : 'removeLineClass';
                editor.operation(function () {
                    handles.forEach(function (handle) {
                        editor[method](handle._handle, 'wrap', className);
                    });
                });
            }

            var aborted = false;
            var deferred = $.Deferred();
            var timeoutDeferred = $.Deferred();
            deferred.done(timeoutDeferred.resolve.bind(timeoutDeferred));

            var addHighlight = _.once(function () {
                editor.off('scroll', addHighlight);

                if (aborted) {
                    return;
                }

                if (self._$container) {
                    self._$container.attr('data-last-updated', new Date().getTime());
                }

                toggleClasses(true, classNameUntilReplaced);
                deferred.always(toggleClasses.bind(null, false, classNameUntilReplaced));

                toggleClasses(true, className);
                timeoutDeferred.always(toggleClasses.bind(null, false, className));
                setTimeout(timeoutDeferred.resolve.bind(timeoutDeferred), ms);
            });

            // ensure the scroll happens first.
            // But at the edge of the document, no scroll will occur, so force it 100ms
            // later if it hasn't happened.
            editor.on('scroll', addHighlight);
            setTimeout(addHighlight, 100);

            return deferred.promise({
                abort: function abort() {
                    aborted = true;
                    deferred.resolve();
                }
            });
        });
    }

    // diff-view-animation.less has an animation lasting for @segmentNavAnimationDuration.
    // Make sure to update that variable if you change the time here.
    var segmentNavAnimationDuration = 1000;
    // see @commentNavAnimationDuration in diff-view-animations.less
    var commentNavAnimationDuration = 1000;

    DiffView.prototype._markLinesFocused = _.partial(addAnimationLineClass, 'line-focused', 'last-focus', segmentNavAnimationDuration);
    DiffView.prototype._markLineCommentsFocused = _.partial(addAnimationLineClass, 'line-comment-focused', 'last-comment-focus', commentNavAnimationDuration);

    return DiffView;
}); // closing diff-view define() call