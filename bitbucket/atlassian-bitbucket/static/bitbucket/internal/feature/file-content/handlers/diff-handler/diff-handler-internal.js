'use strict';

define('bitbucket/internal/feature/file-content/handlers/diff-handler/diff-handler-internal', ['lodash', 'bitbucket/internal/feature/file-content/diff-view-segment-types', 'exports'], function (_, SegmentTypes, exports) {

    'use strict';

    exports.infiniteContext = 10000; // not actually infinite, but sufficiently large.

    /**
     * Checks that all of the segments contain only added <i>or</i> only removed lines.
     *
     * @param {{hunks: [{segments: [{type: string}]}]}} data - diff data containing hunks/segments for a single file
     * @returns {boolean} return true if all the segments are only added or only removed, otherwise false
     */
    exports.isAddedOrRemoved = function (diff) {
        function isAll(type) {
            return _.all(diff.hunks, function (hunk) {
                return _.all(hunk.segments, function (segment) {
                    return segment.type === type;
                });
            });
        }
        return isAll(SegmentTypes.ADDED) || isAll(SegmentTypes.REMOVED);
    };

    /**
     * Creates an override DiffViewOptions that gives the impression that only 'unified' diff is available, and doesn't
     * allow for consumers to set new values (such as when a shortcut is used).
     *
     * @param {{get: function, set: function}} DiffViewOptions - storage for options
     * @param {boolean} canHaveSideBySideDiffView - whether side-by-side diff view is available
     * @param {boolean} forceComments - always show comments
     * @returns {{get: function, set: function}} an option view that may hijack calls to the real options
     */
    exports.optionsOverride = function (DiffViewOptions, canHaveSideBySideDiffView, forceComments) {
        return DiffViewOptions.proxy({
            diffType: canHaveSideBySideDiffView ? undefined : 'unified',
            hideComments: forceComments ? false : undefined
        });
    };
});