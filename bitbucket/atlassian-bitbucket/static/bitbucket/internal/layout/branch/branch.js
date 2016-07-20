'use strict';

define('bitbucket/internal/layout/branch', ['jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/repository/revision-reference-selector', 'bitbucket/internal/layout/branch/branch-layout-analytics', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/revision-reference', 'bitbucket/internal/util/events', 'bitbucket/internal/util/shortcuts', 'exports'], function ($, _, nav, RevisionReferenceSelector, branchAnalytics, pageState, RevisionReference, events, shortcuts, exports) {

    exports.onReady = function (revisionSelector, refQueryParam) {
        refQueryParam = refQueryParam || 'at';
        var addUrlToResults = function addUrlToResults(results) {
            results = RevisionReferenceSelector.prototype._addRefTypeAndRepositoryToResults.call(this, results);

            var uri = nav.parse(window.location.href);

            _.each(results.values, function (ref) {
                if (!ref.url) {
                    var refUri = uri.clone();
                    refUri.replaceQueryParam(refQueryParam, ref.id);
                    ref.url = refUri.query() + (refUri.anchor() ? refUri.anchor() : '');
                }
            });

            return results;
        };

        var revisionReferenceSelector = new RevisionReferenceSelector($(revisionSelector), {
            id: 'repository-layout-revision-selector-dialog',
            dataTransform: addUrlToResults
        });
        shortcuts.bind('branchSelector', _.ary($.fn.click.bind(revisionReferenceSelector.$trigger), 0));

        pageState.setRevisionRef(revisionReferenceSelector.getSelectedItem());

        /* Cascade changes upward */
        events.on('bitbucket.internal.feature.repository.revisionReferenceSelector.revisionRefChanged', function (revisionReference) {
            if (this === revisionReferenceSelector) {
                events.trigger('bitbucket.internal.layout.branch.revisionRefChanged', this, revisionReference);
                pageState.setRevisionRef(revisionReferenceSelector.getSelectedItem());
            }
        });

        /* React to page changes */
        events.on('bitbucket.internal.page.*.revisionRefChanged', function (revisionReference) {
            revisionReferenceSelector.setSelectedItem(RevisionReference.hydrateDeprecated(revisionReference));
        });

        // The 'branch' context is deprecated in 3.0.1 for removal in 4.0. use the 'repository' context instead
        events.on('bitbucket.internal.widget.keyboard-shortcuts.register-contexts', function (keyboardShortcuts) {
            keyboardShortcuts.enableContext('branch');
        });
        var $actionsTrigger = $("#branch-actions");
        var $actionsMenu = $('#branch-actions-menu');
        $actionsMenu.on('aui-dropdown2-show', function () {
            events.trigger('bitbucket.internal.layout.branch.actions.dropdownShown');
            // Focus dropdown2 trigger because if coming from an open branch-selector, the hidecallback will focus
            // the branch selector trigger, hiding the branch-actions dropdown
            $actionsTrigger.focus();
            // dropdown items are client-web-items
            $(this).html(bitbucket.internal.layout.branch.actionsDropdownMenu({
                repository: pageState.getRepository().toJSON(),
                atRevisionRef: pageState.getRevisionRef().toJSON()
            }));
        }).on('aui-dropdown2-hide', function () {
            events.trigger('bitbucket.internal.layout.branch.actions.dropdownHidden');
        });

        branchAnalytics.initLayoutAnalytics($actionsMenu);
    };
});