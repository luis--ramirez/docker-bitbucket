'use strict';

define('bitbucket/internal/feature/file-content/diff-line-info', ['lodash', 'bitbucket/internal/feature/file-content/diff-view-segment-types', 'exports'], function (_, diffViewSegmentTypes, exports) {
    'use strict';

    // The property in a line that holds the line number we need, for each segment type. (e.g. ADDED segments care about the destination line number).

    var numPropForType = {
        'ADDED': 'destination',
        'REMOVED': 'source',
        'CONTEXT': 'source'
    };

    /**
     * @typedef {object} Line
     * @property {number} destination - destination line number
     * @property {number} source - source line number
     * @property {string} line - The content of this line
     * @property {boolean} truncated - was this line truncated?
     */

    /**
     * Information about a line being displayed.
     *
     * @param {DiffSegmentType} lineType - ADDED, REMOVED or CONTEXT
     * @param {number} lineNumber - the line number in the file corresponding to this line's lineType.
     * @param {Line} line - the line itself
     * @param {Object} segment - the segment containing this line (matches REST output)
     * @param {Object} hunk - the hunk containing this line (matches REST output)
     * @param {Object} diff - the diff containing this line (matches REST output)
     * @param {Object} attributes - additional attributes related to this line.
     *
     * @property {DiffSegmentType} lineType - ADDED, REMOVED or CONTEXT
     * @property {number} lineNumber - the line number in the file corresponding to this line's lineType.
     * @property {Line} line - the line itself
     * @property {Object} segment - the segment containing this line (matches REST output)
     * @property {Object} hunk - the hunk containing this line (matches REST output)
     * @property {Object} diff - the diff containing this line (matches REST output)
     * @property {Object} attributes - additional attributes related to this line.
     * @property {{FROM : StashLineHandle, TO : StashLineHandle}} handles - a map of file type to line handle.
     *
     * @class LineInfo
     */
    function LineInfo(lineType, lineNumber, line, segment, hunk, diff, attributes) {
        this.lineType = lineType;
        this.lineNumber = lineNumber;
        this.line = line;
        this.segment = segment;
        this.hunk = hunk;
        this.diff = diff;
        this.handles = { FROM: null, TO: null, all: [] };
        this.attributes = attributes;
    }
    LineInfo.prototype._setHandle = function (fileType, handle) {
        this.handles[fileType] = handle;
        this.handles.all.push(handle);
        this.handles.all = _.uniq(this.handles.all);
    };

    /**
     * Find the range of lines in a segment that are the "expanded" context.
     * i.e. the context lines that are not relevantContextLines
     *
     * @param {Array}  segments - array of segments to compare the
     * @param {Object} seg
     * @param {number} currentIndex
     * @param {number} relevantContextLines
     *
     * @returns {?{start: number, end: number}} the range of expanded context
     */
    function getExpandedRangeForSegment(segments, seg, currentIndex, relevantContextLines) {
        // If the current segment is a CONTEXT line, then we check the previous/next segment for being ADDED or REMOVED
        // Then we'll return an object indicating the range of lines that are "expanded" for this segment

        var prevSeg = segments[currentIndex - 1];
        var nextSeg = segments[currentIndex + 1];

        if (seg.type !== diffViewSegmentTypes.CONTEXT) {
            return null;
        }

        var start = 0;
        var end = seg.lines.length;

        // If the previous segment was an added/removed segment, set the start point
        if (prevSeg && (prevSeg.type === diffViewSegmentTypes.ADDED || prevSeg.type === diffViewSegmentTypes.REMOVED)) {
            start = relevantContextLines;
        }

        // If the next segment was an added/removed segment, set the end point
        if (nextSeg && (nextSeg.type === diffViewSegmentTypes.ADDED || nextSeg.type === diffViewSegmentTypes.REMOVED)) {
            end = end - relevantContextLines;
        }

        // don't return a range if there is overlap between the start and end points, this means that
        // all the context for this segment is relevant and should not be marked as "expanded"
        if (end > start) {
            // N.B. -1 to make it reference the array index
            return { start: start - 1, end: end };
        }

        return null;
    }

    /**
     * Turn a diffJSON object in to an array of line objects.
     *
     * @param {Object} diffJSON
     * @param {Object} options
     * @param {number} options.relevantContextLines
     * @returns {Array<LineInfo>} line info array
     */
    function convertToLineInfos(diffJSON, options) {
        return _.chain(diffJSON.hunks)
        // Create an array of segments objects that contain the hunk and the segment
        .map(function (hunk) {
            return _.map(hunk.segments, function (segment, index) {
                var expandedRange = getExpandedRangeForSegment(hunk.segments, segment, index, options.relevantContextLines);
                return { hunk: hunk, segment: segment, expandedRange: expandedRange };
            });
        }).flatten().map(function (hunkAndSegment) {
            var seg = hunkAndSegment.segment;
            return _.map(seg.lines, function (line, index) {

                var lineType = seg.type;
                var lineNumber = line[numPropForType[seg.type]];

                // If this line is within the expanded range, make it as such.
                var attributes = {
                    expanded: hunkAndSegment.expandedRange && index < hunkAndSegment.expandedRange.end && index > hunkAndSegment.expandedRange.start
                };

                return new LineInfo(lineType, lineNumber, line, seg, hunkAndSegment.hunk, diffJSON, attributes);
            });
        }).flatten().value();
    }

    exports.convertToLineInfos = convertToLineInfos;
});