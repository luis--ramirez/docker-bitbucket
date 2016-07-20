'use strict';

define('bitbucket/internal/feature/file-content/line-handle', function () {
    'use strict';

    /**
     * Generate a wrapper around a CodeMirror LineHandle that we can pass around and abstract the CodeMirror-ness out of.
     * CodeMirror views all our lines as part of the same document. These wrapping StashLineHandles allow us to communicate
     * in terms of line type and line number in a diff, but still reference one of those indexed lines when talking to CodeMirror.
     *
     * The lineInfos are deeply frozen so they can be passed around publicly without any danger.
     *
     * @param {string} [fileType] - the line type to reference (to or from in a sbs diff. Undefined most other times)
     * @param {string} lineType - the line type to reference (context, added, or removed)
     * @param {number} lineNumber - the line number to reference (the file to reference - source or target - depends on the lineType)
     * @param {Object} handle - an internal CodeMirror LineHandle to link to.
     * @constructor
     */

    function StashLineHandle(fileType, lineType, lineNumber, handle) {
        this.fileType = fileType;
        this.lineType = lineType;
        this.lineNumber = lineNumber;
        this._handle = handle;

        // Add a reference to this on the CodeMirror LineHandle to avoid having to query the DOM to get this info
        handle._stashHandle = this;
    }

    return StashLineHandle;
});