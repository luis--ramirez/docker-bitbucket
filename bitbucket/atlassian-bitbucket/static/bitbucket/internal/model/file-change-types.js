'use strict';

define('bitbucket/internal/model/file-change-types', function () {

    'use strict';

    return {
        ADD: 'ADD',
        DELETE: 'DELETE',
        MODIFY: 'MODIFY',
        COPY: 'COPY',
        MOVE: 'MOVE',
        RENAME: 'RENAME',
        UNKNOWN: 'UNKNOWN',
        changeTypeFromId: function changeTypeFromId(id) {
            if (Object.prototype.hasOwnProperty.call(this, id) && typeof this[id] === 'string') {
                return this[id];
            }

            return undefined;
        },
        /**
         * GUESS the change type of a file by looking at a diff of the change.
         * Note that this will never return MOVE/RENAME/COPY which can't be determined by the diff alone.
         * @param diff
         */
        guessChangeTypeFromDiff: function guessChangeTypeFromDiff(diff) {
            if (!diff) {
                return this.UNKNOWN;
            }
            if (diff.binary) {
                if (diff.source === null) {
                    return this.ADD;
                } else if (diff.destination === null) {
                    return this.DELETE;
                } else {
                    return this.MODIFY;
                }
            }
            var firstHunk = diff.hunks[0];
            if (firstHunk) {
                // If we're looking at a Diff then the ChangeType will always be one of Add/Delete/Modify
                // if the file was only Moved/Renamed there would not be a diff.
                if (firstHunk.sourceLine === 0) {
                    return this.ADD;
                } else if (firstHunk.destinationLine === 0) {
                    return this.DELETE;
                } else {
                    return this.MODIFY;
                }
            }
            return this.UNKNOWN;
        }
    };
});