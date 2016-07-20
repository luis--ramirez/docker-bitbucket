'use strict';

define('bitbucket/internal/feature/timezone', ['jquery', 'lodash', 'exports'], function ($, _, exports) {

    /**
     * Formats a select2 item by calling the appropriate soy template.
     *
     * @param item
     * @param item.element {Array<HTMLElement>}
     * @returns {String} a HTML string
     */
    function formatResult(item) {
        if (item.element.length > 0 && item.element[0].tagName.toLowerCase() === 'optgroup') {
            return bitbucket.internal.feature.timezone.regionHeader({
                label: item.text
            });
        }

        var $tz = $(item.element);
        return bitbucket.internal.feature.timezone.selection({
            displayName: $tz.attr('data-display-name'),
            extraClasses: $tz.attr('class'),
            label: $tz.attr('data-label'),
            offset: formatOffset($tz.attr('data-offset')),
            value: $tz.val()
        });
    }

    function formatOffset(offset) {
        if (offset === 'Z') {
            return '±00:00';
        }
        return offset;
    }

    function filterMatcher(term, text, opt) {
        if (!term) {
            return true;
        }
        term = term.toLowerCase();

        var $opt = $(opt);
        return [$opt.attr('data-label'), $opt.attr('data-display-name'), formatOffset($opt.attr('data-offset')), $opt.val()].some(function matches(val) {
            return val && val.toLowerCase().indexOf(term) !== -1;
        });
    }

    exports.onReady = function (id) {
        $('#' + id).auiSelect2({
            formatSelection: formatResult,
            formatResult: formatResult,
            matcher: filterMatcher,
            escapeMarkup: _.identity
        });
    };
});