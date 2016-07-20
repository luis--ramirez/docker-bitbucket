'use strict';

define('bitbucket/internal/feature/file-content/source-line-info', ['exports'], function (exports) {
    'use strict';

    /**
     * Information about a line being displayed.
     *
     * @param {number} lineNumber - the line number in the file.
     * @param {Line} line - the line itself
     * @param {Object} attributes - additional attributes related to this line.
     *
     * @property {number} lineNumber - the line number
     * @property {Line} line - the line itself
     * @property {Object} attributes - additional attributes related to this line.
     * @property {{SOURCE : StashLineHandle, all : Array<StashLineHandle>}} handles - handles to the CodeMirror line. Source currently always has just one.
     *
     * @constructor
     */

    function LineInfo(lineNumber, line, attributes) {
        this.lineNumber = lineNumber;
        this.line = line;
        this.handles = { SOURCE: null, all: [] };
        this.attributes = attributes;
    }

    /**
     * @param {StashLineHandle} handle - a handle to the CodeMirror line
     * @private
     */
    LineInfo.prototype._setHandle = function (handle) {
        this.handles.SOURCE = handle;
        this.handles.all = [handle];
    };

    /**
     * Get LineInfos from REST data.
     *
     * @param {Object} sourceJSON - JSON from the source REST endpoint
     * @returns {Array<LineInfo>}
     */
    exports.convertToLineInfos = function (sourceJSON) {
        var start = sourceJSON.start || 0;
        return sourceJSON.lines.map(function (line, i) {
            return new LineInfo(i + 1 + start, line, {});
        });
    };
});