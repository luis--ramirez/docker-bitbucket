'use strict';

define('bitbucket/internal/feature/repository/revision-reference-selector', ['aui', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/repository', 'bitbucket/internal/model/revision-reference', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/events', 'bitbucket/internal/widget/searchable-selector'], function (AJS, $, _, nav, pageState, Repository, RevisionReference, ajax, events, SearchableSelector) {

    /**
     * A searchable selector for choosing RevisionReferences (branches, tags & commits)
     * @extends {SearchableSelector}
     * @return {RevisionReferenceSelector}  The new RevisionReferenceSelector instance
     *
     * @param {HTMLElement|jQuery}  trigger     The trigger (usually a button) to bind opening the selector to.
     * @param {Object}              options     A hash of options, valid options are specified in RevisionReferenceSelector.prototype.defaults
     */
    function RevisionReferenceSelector(trigger, options) {
        return this.init.apply(this, arguments);
    }

    $.extend(RevisionReferenceSelector.prototype, SearchableSelector.prototype);

    /**
     * Add the current revision reference type and the repository to each item in a collection of results.
     * Is used as the dataTransform function on REST and preloaded results.
     * @return {Object} The modified collection of results
     *
     * @param {Object} results The collection of results
     */
    RevisionReferenceSelector.prototype._addRefTypeAndRepositoryToResults = function (results) {
        if (results && results.values) {
            var newResults = $.extend(true, {}, results); //Deep clone;
            var refType = this._getCurrentType();

            _.each(newResults.values, _.bind(function (ref) {
                ref.type = refType;
                if (!ref.repository) {
                    ref.repository = this.repository && this.repository.toJSON();
                }
            }, this));

            return newResults;
        }

        return results;
    };

    /**
     * Default options.
     * All options can also be specified as functions that return the desired type (except params that expect a function).
     * Full option documentation can be found on SearchableSelector.prototype.defaults
     * @inheritDocs
     *
     * @param {Repository}  repository      The repository that the selector will retrieve revisions from
     * @param {Object}      show            A hash of which tabs to show or hide
     */
    RevisionReferenceSelector.prototype.defaults = $.extend(true, {}, SearchableSelector.prototype.defaults, {
        tabs: [{
            label: 'Branches',
            type: RevisionReference.type.BRANCH,
            url: function url() {
                return this.getBranchesUrl();
            },
            resultsTemplate: bitbucket.internal.feature.repository.revisionReferenceSelectorBranchResults,
            searchPlaceholder: AJS.I18n.getText('bitbucket.web.revisionref.selector.branch.search.placeholder')
        }, {
            label: 'Tags',
            type: RevisionReference.type.TAG,
            url: function url() {
                return this.getTagsUrl();
            },
            resultsTemplate: bitbucket.internal.feature.repository.revisionReferenceSelectorTagResults,
            searchPlaceholder: AJS.I18n.getText('bitbucket.web.revisionref.selector.tag.search.placeholder')
        }, {
            label: 'Commits',
            type: RevisionReference.type.COMMIT,
            url: function url() {
                return this.getCommitsUrl();
            },
            resultsTemplate: bitbucket.internal.feature.repository.revisionReferenceSelectorCommitResults,
            searchPlaceholder: AJS.I18n.getText('bitbucket.web.revisionref.selector.commit.search.placeholder')
        }],
        queryParamKey: 'filterText',
        namespace: 'revision-reference-selector',
        itemSelectedEvent: 'bitbucket.internal.feature.repository.revisionReferenceSelector.revisionRefChanged',
        itemUnselectedEvent: 'bitbucket.internal.feature.repository.revisionReferenceSelector.revisionRefUnselected',
        itemDataKey: 'revision-ref',
        statusCodeHandlers: ajax.ignore404WithinRepository(),
        triggerContentTemplate: bitbucket.internal.feature.repository.revisionReferenceSelectorTriggerContent,
        extraClasses: 'revision-reference-selector',
        repository: function repository() {
            return pageState.getRepository();
        },
        show: { branches: true, tags: true, commits: false },
        dataTransform: RevisionReferenceSelector.prototype._addRefTypeAndRepositoryToResults,
        postOptionsInit: function postOptionsInit() {
            this.setRepository(this._getOptionVal('repository'));
        },
        paginationContext: 'revision-reference-selector'
    });

    /**
     * Initialise the selector
     * @override
     * @return {RevisionReferenceSelector} The initialised RevisionReferenceSelector.
     *
     * @param {HTMLElement|jQuery}  trigger     The trigger (usually a button) to bind opening the selector to.
     * @param {Object}              options     A hash of options, valid options are specified in RevisionReferenceSelector.prototype.defaults
     */
    RevisionReferenceSelector.prototype.init = function (trigger, options) {
        SearchableSelector.prototype.init.apply(this, arguments);

        return this;
    };

    /**
     * Merge the supplied options with the defaults and remove tabs that aren't going to be shown.
     * @override
     *
     * @param {Object}  options A hash of options, valid options are specified in RevisionReferenceSelector.prototype.defaults
     */
    RevisionReferenceSelector.prototype.setOptions = function (options) {
        if (options.extraClasses) {
            options.extraClasses = this.defaults.extraClasses + ' ' + $.trim(options.extraClasses);
        }
        options = $.extend(true, {}, this.defaults, options);
        var typesMap = {
            branches: RevisionReference.type.BRANCH.id,
            tags: RevisionReference.type.TAG.id,
            commits: RevisionReference.type.COMMIT.id
        };
        var typesToShow = _.filter(typesMap, function (type, key) {
            //Only show types with enabled in the `show` options.
            return options.show[key];
        });

        //Remove any tabs whose type is not in `typesToShow`
        options.tabs = _.filter(options.tabs, function (tab) {
            return _.indexOf(typesToShow, tab.type.id) !== -1;
        });

        this.options = options;
    };

    /**
     * Build a RevisionReference from the metadata on the trigger.
     * @override
     * @return {RevisionReference} The newly created RevisionReference
     */
    RevisionReferenceSelector.prototype._getItemFromTrigger = function () {
        var $triggerItem = this.$trigger.find('.name');

        return new RevisionReference($.extend({}, this._buildObjectFromElementDataAttributes($triggerItem), {
            displayId: $triggerItem.text(),
            repository: this.repository
        }));
    };

    /**
     * Get the url for the branches REST endpoint for the current repository
     * @return  {string}    The url to the rest endpoint for branches
     */
    RevisionReferenceSelector.prototype.getBranchesUrl = function () {
        return nav.rest().project(this.repository.getProject()).repo(this.repository).branches().build();
    };

    /**
     * Get the url for the tags REST endpoint for the current repository
     * @return  {string}    The url to the rest endpoint for tags
     */
    RevisionReferenceSelector.prototype.getTagsUrl = function () {
        return nav.rest().project(this.repository.getProject()).repo(this.repository).tags().build();
    };

    /**
     * Get the url for the commits REST endpoint for the current repository
     * @return  {string}    The url to the rest endpoint for commits
     */
    RevisionReferenceSelector.prototype.getCommitsUrl = function () {
        return nav.rest().project(this.repository.getProject()).repo(this.repository).commits().build();
    };

    /**
     * Get the current repository
     * @return {Repository}     The current repository
     */
    RevisionReferenceSelector.prototype.getRepository = function () {
        return this.repository;
    };

    /**
     * Update the current repository.
     * Resets state for the current scrollable and trigger and hides the dialog.
     *
     * @param {Repository}  repository  The new repository
     */
    RevisionReferenceSelector.prototype.setRepository = function (repository) {
        var currentRepository = this.repository;

        if (repository instanceof Repository && !repository.isEqual(currentRepository)) {
            //Changing repository to the same repository should be a no-op.
            this.repository = repository;

            if (currentRepository) {
                //Only reset the scrollable and trigger, close the dialog and trigger the event when we are changing between repositories, not setting the repo for the first time.
                var currentScrollable = this._getCurrentScrollable();

                if (currentScrollable) {
                    //We don't call _populateScrollable, because after changing repository it doesn't make sense to show the preload data
                    this._emptyScrollable(currentScrollable);
                    currentScrollable.init();
                }
                this.clearSelection();
                this.dialog.hide();

                events.trigger('bitbucket.internal.feature.repository.revisionReferenceSelector.repoChanged', this, repository, this._getOptionVal('context'));
            }
        }
    };

    /**
     * Get the RevisionReference type of the current tab.
     * @return {Object} The current tab type
     */
    RevisionReferenceSelector.prototype._getCurrentType = function () {
        return this.tabs[this.currentTabId || 0].type;
    };

    /**
     * Set the selected item.
     * Updates the trigger and fires the event if the item is different to the previous item.
     * @override
     *
     * @param {Object} revisionRef The RevisionReference to select.
     */
    RevisionReferenceSelector.prototype.setSelectedItem = function (revisionRef) {
        if (revisionRef instanceof RevisionReference && !revisionRef.isEqual(this._selectedItem)) {
            this._itemSelected(revisionRef);
        }
    };

    RevisionReferenceSelector.prototype.clearSelection = function () {
        SearchableSelector.prototype.clearSelection.apply(this, arguments);
        // null arg in place of revisionRef from the itemSelectedEvent
        events.trigger(this._getOptionVal('itemUnselectedEvent'), this, null, this._getOptionVal('context'));
    };

    /**
     * Handle an item being selected.
     * This creates a new RevisionReference from the item data,
     * triggers the 'stash.feature.repository.revisionReferenceSelector.revisionRefChanged' event with the new RevisionReference,
     * sets the selectedItem to the new RevisionReference and updates the trigger and form field (if supplied)
     * @override
     *
     * @param {Object|RevisionReference}  refDataOrRevisionReference     The JSON data or a RevisionReference for the selected item.
     */
    RevisionReferenceSelector.prototype._itemSelected = function (refDataOrRevisionReference) {
        var refData;
        var ref;

        if (refDataOrRevisionReference instanceof RevisionReference) {
            refData = refDataOrRevisionReference.toJSON();
            ref = refDataOrRevisionReference;
        } else {
            refData = _.pick(refDataOrRevisionReference, _.keys(RevisionReference.prototype.namedAttributes));
            ref = new RevisionReference(refData);
        }

        this._selectedItem = ref;

        if (this._getOptionVal('field')) {
            $(this._getOptionVal('field')).val(refData.id);
        }

        var titleContent = bitbucket.internal.feature.repository.revisionReferenceSelectorTitle({ ref: refData });

        this.updateTrigger({ ref: refData }, titleContent);

        events.trigger(this._getOptionVal('itemSelectedEvent'), this, ref, this._getOptionVal('context'));
    };

    return RevisionReferenceSelector;
});