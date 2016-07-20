'use strict';

define('bitbucket/internal/util/syntax-highlight', ['codemirror', 'jquery', 'bitbucket/internal/util/determine-language', 'exports'],
/**
 * Syntax highlights a <pre><code data-language=""></code></pre>} block
 * @exports bitbucket/internal/util/syntax-highlight
 */
function (CodeMirror, $, determineLanguage, exports) {

    'use strict';

    /**
     * Highlight a code block element.
     * The code element is expected to have a data-language attribute and be inside of a pre element.
     * i.e. pre > code[data-language]
     *
     * @param {jQuery|HTMLElement} el - A code element.
     */

    function highlightCodeblock(el) {
        var $el = $(el);
        if (!$el.length) {
            return;
        }

        var mode = $el.attr('data-language');

        determineLanguage.getCodeMirrorModeForName(mode).then(runMode).fail(wrmFail);

        /**
         * Run the CodeMirror mode over the text. CodeMirror will dump the output back in to the given element.
         */
        function runMode(codeMirrorMode) {
            CodeMirror.runMode($el.text(), codeMirrorMode.mime || { name: mode }, $el[0]);
        }

        function wrmFail(reason) {
            console.warn(reason || mode + ' could not be loaded for syntax highlighting.');
        }
    }

    /**
     * Highlight all <code>pre > code[data-language]</code> blocks in a given container
     *
     * @param {jQuery|HTMLElement} container
     */
    function highlightContainer(container) {
        $(container).find('pre > code[data-language]').each(function () {
            highlightCodeblock(this);
        });
    }

    exports.codeblock = highlightCodeblock;
    exports.container = highlightContainer;
});