"use strict";

/* global exports */

// There is extra hoop jumping here so this code can be included in both a browser context with almond.js and in a
// Nodes.js context during the build step. This will ensure that the list of common-modes is always in sync.

(function (commonModes) {
    if ((typeof exports === "undefined" ? "undefined" : babelHelpers.typeof(exports)) === "object" && (typeof module === "undefined" ? "undefined" : babelHelpers.typeof(module)) === "object") {
        exports.commonModes = commonModes();
    } else {
        define('bitbucket/internal/feature/file-content/text-view/common-modes', [], commonModes);
    }
})(function () {
    'use strict';

    return ['clike', 'commonlisp', 'css', 'htmlmixed', 'javascript', 'markdown', 'perl', 'php', 'python', 'ruby', 'sass', 'shell', 'sql', 'vbscript', 'xml', 'yaml'];
});