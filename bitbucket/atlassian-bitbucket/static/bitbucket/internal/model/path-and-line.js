'use strict';

define('bitbucket/internal/model/path-and-line', ['bitbucket/internal/model/path'], function (Path) {

    'use strict';

    // split the path from a line number and diff side format is /\?[FT]\d+$/ where F is from and T is to.
    // Note that the file is not encoded so any filename ending in the format expression will be incorrectly
    // matched.

    function PathAndLine(stringOrArray, lineNumber, side) {
        this.path = new Path(stringOrArray && stringOrArray.path || stringOrArray);
        if (lineNumber) {
            this.line = { no: lineNumber, type: side || 'TO' };
        } else if (stringOrArray && stringOrArray.line) {
            this.line = stringOrArray.line;
        } else {
            var components = this.path.getComponents();
            var lastComponentIndex = components.length - 1;
            if (lastComponentIndex >= 0) {
                var lastComponent = components[lastComponentIndex];
                var sepIndex = Math.max(lastComponent.lastIndexOf('?F'), lastComponent.lastIndexOf('?T'));
                if (sepIndex > 0) {
                    // we use Number since parseInt will not fail if there are trailing non-numbers
                    // this will reduce false positives for line numbers
                    lineNumber = Number(lastComponent.substring(sepIndex + 2)) || undefined;
                    if (lineNumber) {
                        this.line = { no: lineNumber, type: lastComponent[sepIndex + 1] === 'F' ? 'FROM' : 'TO' };
                        components[lastComponentIndex] = lastComponent.substring(0, sepIndex);
                        this.path = new Path(components);
                    }
                }
            }
        }
    }

    PathAndLine.prototype.toString = function () {
        return this.path.toString() + (this.line ? (this.line.type === 'FROM' ? '?F' : '?T') + this.line.no : '');
    };

    return PathAndLine;
});