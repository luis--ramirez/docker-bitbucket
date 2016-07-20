'use strict';

define('bitbucket/internal/util/css', ['bitbucket/internal/util/function'], function (fn) {
    'use strict';

    function getSheet() {
        var style = document.createElement('style');
        style.appendChild(document.createTextNode(''));
        document.head.appendChild(style);
        return style.sheet;
    }

    var indices = [];

    var sheet = getSheet();

    var cssUtil = {
        chain: function chain() {
            var removals = [];

            return {
                appendRule: function appendRule(ruleString) {
                    removals.push(cssUtil.appendRule(ruleString));
                    return this;
                },
                destroy: function destroy() {
                    fn.applyAll(removals);
                    removals = [];
                }
            };
        },
        appendRule: function appendRule(ruleString) {
            var token = {};
            var index = indices.length;
            indices.push(token);
            sheet.insertRule(ruleString, index);

            return function remove() {
                var index = indices.indexOf(token);
                if (index !== -1) {
                    sheet.deleteRule(index);
                    indices.splice(index, 1);
                }
            };
        },
        __sheet: sheet // Visible for testing
    };

    return cssUtil;
});