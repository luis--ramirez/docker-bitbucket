'use strict';

define('bitbucket/internal/util/focus-snapshot', ['jquery'], function ($) {

    'use strict';

    return function () {
        var $el;
        var selection;
        return {
            save: function save() {
                var element = document.activeElement;
                if (element) {
                    $el = $(element);
                    if ($el.is(':text, textarea')) {
                        selection = $el.getSelection(); // requires rangy (rangy-input.js)
                    }
                }
            },
            restore: function restore() {
                if ($el) {
                    $el.focus();
                    if (selection) {
                        $el.setSelection(selection.start, selection.end);
                    }
                }
            }
        };
    }();
});