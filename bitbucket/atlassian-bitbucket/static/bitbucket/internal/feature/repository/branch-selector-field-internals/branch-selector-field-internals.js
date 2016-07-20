'use strict';

define('bitbucket/internal/feature/repository/branch-selector-field-internals', ['aui', 'jquery', 'lodash', 'bitbucket/internal/feature/repository/revision-reference-selector', 'bitbucket/internal/model/revision-reference', 'bitbucket/internal/util/events', 'bitbucket/internal/widget/searchable-selector'], function (AJS, $, _, RevisionReferenceSelector, RevisionReference, events, SearchableSelector) {
    // HACK: We don't know when these fields might get removed from the DOM. In order to prevent memory leaks,
    // I'm destroying obsolete inputs when certain events happen.
    var fields = [];
    function destroyRemovedFields() {
        var newFields = [];
        var i = fields.length;
        while (i--) {
            if (!fields[i].$input.closest(document.body).length) {
                fields[i].destroy();
            } else {
                newFields.push(fields[i]);
            }
        }
        fields = newFields;
    }
    $(document).bind('hideLayer', function () {
        // Without timeout the dialogs aren't removed
        setTimeout(destroyRemovedFields, 0);
    });

    function processPreloadData(preloadData) {
        if (!preloadData || !_.isArray(preloadData)) {
            return null;
        }
        // inflate type for each item
        _.each(preloadData, function (item) {
            var realType = RevisionReference.type.from(item.type);
            if (realType != null) {
                item.type = realType;
            }
        });
        return SearchableSelector.constructDataPageFromPreloadArray(preloadData);
    }

    events.on('bitbucket.internal.widget.branchselector.inputAdded', function (id, options) {
        $(document).ready(function () {
            var $input;

            function initBranchSelectorField() {
                $input = $input.length ? $input : $('#' + id);

                if (!$input.length) {
                    console.log('Branch selector field (#' + id + ') was not found and not initialised. See https://jira.atlassian.com/browse/STASH-3914');
                }
                var $removeSelection = $input.nextAll('.remove-link');
                var preloadedRefs = processPreloadData(options.preloadData);
                var revisionReferenceSelector = new RevisionReferenceSelector($input.prevAll('.branch-selector-field'), {
                    context: id,
                    field: $input,
                    triggerPlaceholder: options.triggerPlaceholder,
                    show: { tags: options.showTags },
                    preloadData: preloadedRefs,
                    extraClasses: options.extraClasses,
                    paginationContext: 'branch-selector-field'
                });
                if (options.revisionId) {
                    var fromPreloadData = preloadedRefs && _.findWhere(preloadedRefs.values, { id: options.revisionId });
                    if (fromPreloadData) {
                        revisionReferenceSelector.setSelectedItem(new RevisionReference({ id: fromPreloadData.id,
                            displayId: fromPreloadData.displayId,
                            type: fromPreloadData.type,
                            isDefault: false }));
                    } else {
                        revisionReferenceSelector.setSelectedItem(RevisionReference.hydrateRefFromId(options.revisionId));
                    }
                }
                $removeSelection.click(function (e) {
                    e.preventDefault();
                    revisionReferenceSelector.clearSelection();
                    $removeSelection.addClass('hidden');
                });
                var refChangedHandler = function refChangedHandler(revisionRef) {
                    if (this === revisionReferenceSelector) {
                        $input.val(revisionRef ? revisionRef.getId() : '');

                        events.trigger('bitbucket.component.branchSelector.change', null, {
                            elementId: id,
                            ref: revisionRef ? revisionRef.toJSON() : null
                        });

                        if (revisionRef.getType().id === RevisionReference.type.TAG.id) {
                            $removeSelection.text(AJS.I18n.getText('bitbucket.web.branch.selector.remove.tag'));
                        } else {
                            $removeSelection.text(AJS.I18n.getText('bitbucket.web.branch.selector.remove.branch'));
                        }
                        $removeSelection.toggleClass('hidden', !revisionRef);
                    }
                };
                events.on('bitbucket.internal.feature.repository.revisionReferenceSelector.revisionRefChanged', refChangedHandler);
                fields.push({
                    $input: $input,
                    destroy: function destroy() {
                        events.off('bitbucket.internal.feature.repository.revisionReferenceSelector.revisionRefChanged', refChangedHandler);
                        revisionReferenceSelector.destroy();
                        revisionReferenceSelector = null;
                    }
                });
            }

            $input = $('#' + id);
            if ($input.length) {
                initBranchSelectorField();
            } else {
                _.defer(initBranchSelectorField);
            }
        });
    });
});
require('bitbucket/internal/feature/repository/branch-selector-field-internals');