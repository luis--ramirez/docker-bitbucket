'use strict';

/**
 * Defines methods that operate on data only, no REST or Stash calls should happen in this module.
 */
define('bitbucket/internal/feature/file-content/diff-view-context/diff-view-context-internal', ['jquery', 'lodash', 'bitbucket/internal/feature/file-content/diff-view-segment-types', 'bitbucket/internal/model/file-change-types', 'bitbucket/internal/util/function', 'exports'], function ($, _, SegmentTypes, fileChangeTypes, fn, exports) {

    var EMPTY_HUNK = { destinationLine: 1, destinationSpan: 0, sourceLine: 1, sourceSpan: 0 };

    var isAdded = fn.eq(SegmentTypes.ADDED);

    /**
     * @type {Function} returns true if the change type is added, else false.
     */
    exports.isAdded = isAdded;

    /**
     * Renders separated html snippets for the given hunks.
     *
     * @param {Array} hunks - objects containing details about the hunks
     * @param {function} toHtml - converts the relative line values to html
     * @returns {Array}
     */
    exports.getSeparatedHunkHtml = function (hunks, fileChangeType, toHtml) {
        /**
         * Look at a hunk and inspect its diff to see the change type
         * @param {Object} hunk
         * @returns {string}
         */
        function getChangeType(fileChangeType) {
            switch (fileChangeType) {
                case fileChangeTypes.ADD:
                    return SegmentTypes.ADDED;
                case fileChangeTypes.DELETE:
                    return SegmentTypes.REMOVED;
                default:
                    return SegmentTypes.CONTEXT;
            }
        }

        var changeType = getChangeType(fileChangeType);

        var added = isAdded(changeType);

        function getHunk(hunk) {
            return {
                line: added ? hunk.destinationLine : hunk.sourceLine,
                span: added ? hunk.destinationSpan : hunk.sourceSpan
            };
        }

        // Offset is _always_ relative to source
        function calcOffset(hunk) {
            return hunk.sourceLine + hunk.sourceSpan - (hunk.destinationLine + hunk.destinationSpan);
        }

        // Append an empty 'hunk' to the start so we can calculate the separation gap between this hunk and the next
        return _.map(_.zip([EMPTY_HUNK].concat(hunks), hunks.concat({})), function (args) {

            var hunk = getHunk(args[0]);
            var nextHunk = getHunk(args[1]);
            var isBelow = nextHunk.line > 1;
            // Always show the end separator - we don't (safely) know how long the file is
            var isAbove = hunk.span > 0;

            // Data values needed for expanding
            var lineStart = hunk.line + hunk.span;
            var lineEnd = nextHunk.line - 1;
            // Added files have no offset - this is important for the logic in displayExpandedContext()
            var destOffset = added ? 0 : calcOffset(args[0]);

            return toHtml(lineStart, lineEnd, destOffset, changeType, isBelow, isAbove);
        });
    };

    /**
     * Will fetch the lines required to fill some/all of the context.
     * This may either do a single request and slice results in memory, or do two requests.
     *
     * @param startIndex source line to start expanding from (0-based)
     * @param endIndex source line to start expanding to (0-based)
     * @param browse callback returning a promise that normally invoked the /browse REST endpoint and returns
     *               Function(start, limit) => Promise<{start, size, text}>
     * @param maxContext number of lines to fetch in a single request
     * @param options {{maxLimit: number}}
     * @returns Promise<{startSep, endEnd, contexts: [{start, size, lines}]}>
     */
    exports.fetchContext = function fetchContext(startIndex, endIndex, browse, maxContext, options) {

        // Unfortunately we don't know how big the file is, which makes this more complicated :(
        var limit = !isNaN(endIndex) ? endIndex - startIndex + 1 : options.maxLimit;

        function sliceLines(data, start, end) {
            return data && _.extend({}, data, {
                lines: data.lines.slice(start, end)
            });
        }

        /**
         * Handles the actual logic of what to do with a given start/limit request.
         * The callback allows the caller to make either one request or two, depending on the size of the request.
         *
         * This is the crux of what lines need to be shown and what to separate.
         *
         * To make the display logic easier we're return an array 'contexts' which will be joined with a separator
         * Return an array of one element means there is no separator to fill, but 'null' represents more data
         * ie at the start/end of the file
         * @param callback Function(start, limit) => Promise<[{start, size, [lines]}]>
         */
        var getExactResults = function getExactResults(callback) {
            return $.when(
            // Fetch 1 more result to work out if we're at the end
            startIndex === 0 ? null : callback(startIndex, maxContext + (!endIndex ? 1 : 0)), !endIndex ? null : callback(startIndex + limit - maxContext, maxContext)).then(function (lines1, lines2) {
                if (!lines2) {
                    // We don't actually know how many lines there are in this file
                    var hasMore = lines1.lines.length > maxContext;
                    return {
                        startSep: lines1.start + lines1.lines.length + (hasMore ? -1 : 0),
                        contexts: hasMore ? [sliceLines(lines1, 0, -1), null] : [lines1]
                    };
                } else if (!lines1) {
                    return { startSep: 0, endSep: lines2.start, contexts: [null, lines2] };
                } else {
                    return { startSep: lines1.start + maxContext, endSep: lines2.start, contexts: [lines1, lines2] };
                }
            });
        };

        // Is the range of missing lines bigger than our configured maximum?
        if (limit < options.maxLimit) {
            // Do a single query and slice the results
            return browse(startIndex, limit).then(function (data) {
                // The remaining lines will fit within the space of two contexts
                if (limit <= maxContext * 2) {
                    return $.Deferred().resolve({ startSep: 0, endSep: 0, contexts: [data] });
                } else {
                    return getExactResults(function (start) {
                        return $.Deferred().resolve({ start: start, lines: data.lines });
                    }).then(function (result) {
                        return _.extend({}, result, { contexts: [sliceLines(result.contexts[0], 0, maxContext), sliceLines(result.contexts[1], -maxContext)]
                        });
                    });
                }
            });
        } else {
            // Limit is too big - do two requests with the exact size
            return getExactResults(browse);
        }
    };

    /**
     * returns a function which transforms contexts pulled from a /browse REST response into hunks
     * that would fit into a /diff REST response and that can be inserted into a diff viewer.
     *
     * @param {number} offset - between the source and destination lines
     * @param {string} changeType - the type of file change we are expecting
     * @returns {string}
     */
    exports.toHunks = function toHunks(offset, changeType) {

        // +1 because n will be 0 indexed - this is just to track where we need this logic
        function fixOffset(n) {
            return n + 1;
        }

        return function display(result) {
            var hunks = [];
            // Go through the contexts provided and turn them in to hunks that we can use
            // to display those hunks and work out if more separators are necessary
            _.each(result.contexts, function render(context) {
                if (context) {
                    hunks.push({
                        segments: [{
                            // We need to convert 'text' to 'line'
                            type: changeType,
                            lines: _.map(context.lines, function (line) {
                                return { line: line.text };
                            })
                        }],
                        sourceLine: fixOffset(context.start),
                        destinationLine: fixOffset(context.start) - offset,
                        isLastPage: context.isLastPage
                    });
                }
            });

            return hunks.length ? hunks : '';
        };
    };
});