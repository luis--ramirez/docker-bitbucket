'use strict';

define('bitbucket/internal/feature/repository/branch-selector', ['aui', 'jquery', 'bitbucket/internal/feature/repository/revision-reference-selector'], function (AJS, $, RevisionReferenceSelector) {

    /**
     * A convenience wrapper around RevisionReferenceSelector for showing a selector with only branches.
     * @return {RevisionReferenceSelector} The new RevisionReferenceSelector instance
     *
     * @param {HTMLElement|jQuery}  trigger     The trigger (usually a button) to bind opening the selector to.
     * @param {Object}              options     A hash of options, valid options are specified in RevisionReferenceSelector.prototype.defaults
     */
    function BranchSelector(trigger, options) {
        //A branch selector is just a branches only `RevisionReferenceSelector`
        options = $.extend({
            show: { branches: true, tags: false, commits: false },
            triggerPlaceholder: AJS.I18n.getText('bitbucket.web.branch.selector.default'),
            paginationContext: 'branch-selector'
        }, options);

        return new RevisionReferenceSelector(trigger, options);
    }

    return BranchSelector;
});