define('internal/util/highlight-text', [
    'internal/util/regexp'
], function(
    regexp
) {

    'use strict';

    var ESCAPE_HTML_SPECIAL_CHARS = /[&"'<>`]/g;

    var escapeHtmlReplacement = function(str) {
        var special = {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            '\'': '&#39;',
            '`': '&#96;'
        };

        if (special.hasOwnProperty(str)) {
            return special[str];
        }

        return '&quot;';
    };

    /**
     * Sanitise a string for use with innerHTML or as an attribute.
     * Inlined from AUI: AJS.escapeHtml
     *
     * @param {String} str
     */
    var escapeHtml = function(str) {
        return str.replace(ESCAPE_HTML_SPECIAL_CHARS, escapeHtmlReplacement);
    };

    var escapeHtmlRegexp = function(str) {
        return regexp.escape(escapeHtml(str));
    };

    return {
        /**
         * Wraps matching text in <mark> tags
         *
         * @param {string}          sourceText          The text within which to look for matches to highlight
         * @param {string|Array}    highlightText       Single or multiple strings to highlight within the sourceText
         * @param {string}          modifiers           Regex modifiers to control what will be matched. The default
         *                                              value is 'gi', which translates into global case-insensitive
         *                                              matching. This argument value must contain valid Regex modifiers,
         *                                              see documentation of the RegExp object for valid values.
         * @return {string} HTML string with the textual parts html-escaped
         */
        highlight: function(sourceText, highlightText, modifiers) {
            if (!highlightText || highlightText.length === 0) {
                return escapeHtml(sourceText);
            }

            var patternStr = (typeof highlightText === 'string') ?
                escapeHtmlRegexp(highlightText) :
                highlightText.map(escapeHtmlRegexp).join('|');
            var appliedModifiers = (modifiers == null) ? 'gi' : modifiers; // default modifiers: case-insensitive + global
            var pattern = new RegExp(patternStr, appliedModifiers);

            return escapeHtml(sourceText).replace(pattern, '<mark>$&</mark>');
        }
    };
});