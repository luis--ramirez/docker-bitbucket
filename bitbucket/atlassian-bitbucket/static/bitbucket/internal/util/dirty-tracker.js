'use strict';

define('bitbucket/internal/util/dirty-tracker', ['aui', 'jquery', 'lodash', 'exports'], function (AJS, $, _, exports) {

    'use strict';

    /*
        Tracks whether a form field has been modified by the user directly and sets the `data-dirty` attribute on the element.
         dirtyTracker.track can be called with either a collection of elements or with a selector and/or container for live event binding.
        dirtyTracker.track can be called without params and will default to live event binding for input and textarea fields on the document body.
         dirtyTracker.untrack will remove either the direct or live event binding. It needs to be passed the same parameters as the original `track` call.
     */

    var dirtyEvents = 'change input keypress keydown cut paste'; //Pokemon!
    var defaultContainer = document.body;
    var defaultSelector = 'input, textarea';

    function dirtyHandler(e, opts) {
        var nonPrintingChangeKeys = [AJS.keyCode.BACKSPACE, AJS.keyCode.DELETE];

        if (opts && opts.synthetic) {
            //this was a synthetic event that shouldn't influence the dirty state
            return;
        }

        if (!$(e.target).is('input[type=text], textarea') && e.type !== 'change') {
            //For form fields that aren't text inputs or textareas, only set dirty on the `change` event
            return;
        }

        if (e.type === "keydown" && _.indexOf(nonPrintingChangeKeys, e.keyCode) === -1) {
            //We only want to catch the keydown when the user has deleted text, everything else is handled by the other events
            return;
        }

        $(this).attr("data-dirty", true).off(dirtyEvents, dirtyHandler); //Unbind from the element directly to handle non-live-event tracking
    }

    exports.track = function (opts) {
        opts = opts || {};

        if (opts.elements) {
            //we've got a collection of elements, bind the dirty tracking to them directly.
            $(opts.elements).on(dirtyEvents, dirtyHandler);
        }

        if (opts.selector || opts.container || !opts.elements) {
            //If there is a selector or container specified, assume we want to do live events augmented by the defaults.
            //Only do fully default live events when no `elements` are supplied
            var $container = $(opts.container || defaultContainer);
            var selector = opts.selector || defaultSelector;

            selector = _.map(selector.split(','), function (selectorPart) {
                return selectorPart.replace(/\s*$/, ':not([data-dirty])');
            }).join(',');

            $container.on(dirtyEvents, selector, dirtyHandler);
        }
    };

    exports.untrack = function (opts) {
        opts = opts || {};

        if (opts.elements) {
            //we've got a collection of elements, unbind the dirty tracking from them directly.
            $(opts.elements).off(dirtyEvents, dirtyHandler);
        }

        if (opts.selector || opts.container || !opts.elements) {
            //If there is a selector or container specified, assume we want to unbind the live events augmented by the defaults.
            //Only unbind the fully default live events when no `elements` are supplied
            var $container = $(opts.container || defaultContainer);
            var selector = opts.selector || defaultSelector;

            selector = _.map(selector.split(','), function (selectorPart) {
                return selectorPart.replace(/\s+$/, '') + ':not([data-dirty])';
            }).join(',');

            $container.off(dirtyEvents, selector, dirtyHandler);
        }
    };
});