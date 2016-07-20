'use strict';

define('bitbucket/internal/widget/searchable-multi-selector', ['aui', 'jquery', 'lodash', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/events', 'bitbucket/internal/util/function', 'bitbucket/internal/util/promise'], function (AJS, $, _, ajax, events, fn, promiseUtils) {

    'use strict';

    /**
     *
     * @param $field the input field to convert to a searchable multi selector
     * @param options the options for configuring the multi-selector.
     * @constructor
     */

    function SearchableMultiSelector($field, options) {
        this._$field = $field;
        options = this._options = $.extend(true, {}, this.defaults, options);

        initDataSource(this);

        if (!_.isFunction(options.selectionTemplate)) {
            throw new Error("a selectionTemplate must be a function");
        }

        if (!_.isFunction(options.resultTemplate)) {
            throw new Error("a resultTemplate must be a function");
        }

        // Rather than storing the selected item data in a delimited string in a form field,
        // we hook in to the initialisation and change events and maintain an array of selected items.
        this._selectedItems = [];

        this._initialItems = [];
        this._excludedIds = _.map(options.excludedItems, options.generateId);

        initSelect2(this);

        this.setSelectedItems(options.initialItems.slice(0));
    }

    $.extend(true, SearchableMultiSelector.prototype, events.createEventMixin('bitbucket.internal.widget.searchable.multi.selector'), {
        defaults: {
            minimumInputLength: 2,
            extraClasses: null,
            dropdownClasses: null,
            debounceInterval: 300,
            initialItems: [],
            excludedItems: [],
            urlParams: {},
            hasAvatar: false,
            inputTooShortTemplate: function inputTooShortTemplate() {
                return AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.multi.selector.help'));
            },
            noMatchesTemplate: function noMatchesTemplate() {
                return AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.multi.selector.no.match'));
            },
            searchingTemplate: function searchingTemplate() {
                return AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.multi.selector.searching'));
            },
            generateId: function generateId(item) {
                return item.id || item.name;
            },
            generateText: function generateText(item) {
                return item.displayName || item.name;
            },
            prepareSearchTerm: _.identity
        },

        /**
         * @returns {Array} the currently selected items
         */
        getSelectedItems: function getSelectedItems() {
            return _.pluck(this._selectedItems, 'item');
        },
        /**
         * @param {Array} items the items to replace the current selection with
         */
        setSelectedItems: function setSelectedItems(items) {
            this._initialItems = items.slice(0);
            this._$field.auiSelect2('val', _.map(items, this._options.generateId));
        },
        /**
         * Clear the selected items
         */
        clearSelectedItems: function clearSelectedItems() {
            this.setSelectedItems([]);
        }
    });

    function PagedDataSource(url, urlParams) {
        this._url = url;
        this._urlParams = urlParams;
        this.clear();
        this._pageReceived = _.bind(this._pageReceived, this);
    }

    PagedDataSource.prototype.clear = function () {
        this._nextPageStart = 0;
    };

    PagedDataSource.prototype.nextPage = function (filter) {
        return ajax.rest({
            url: this._url,
            data: $.extend({}, this._urlParams, {
                start: this._nextPageStart,
                filter: filter
            })
        }).done(this._pageReceived);
    };

    PagedDataSource.prototype._pageReceived = function (page) {
        this._nextPageStart = page.nextPageStart || page.start + page.size;
    };

    SearchableMultiSelector.PagedDataSource = PagedDataSource;

    function DelayedDataSource(delegate, debounceInterval) {
        this.clear = _.bind(delegate.clear, delegate);
        this.nextPage = promiseUtils.delay(_.bind(delegate.nextPage, delegate), debounceInterval);
    }

    //
    // Utility functions
    //

    function showNoResultsIfAllDisabled(selector) {
        // Select2 stupidly hides duplicate results, but doesn't recheck and display
        // the "no results" message if all the options are hidden.
        //  so we do that here manually.

        var $results = $('.select2-drop-active > .select2-results');
        if (!$results.length) {
            return;
        }

        // if all results are disabled
        if ($results.children('.select2-result-selectable').length === 0 && $results.children('.select2-disabled').length) {
            $('<li class="select2-no-results"></li>').html(selector._options.noMatchesTemplate()).appendTo($results);
        }
    }

    function convertToSelect2Entity(options, item) {
        return {
            id: options.generateId(item),
            text: options.generateText(item),
            item: item
        };
    }

    function reject(list, item) {
        return _.reject(list, function (selection) {
            return selection.id === item.id;
        });
    }

    function maybeAbort(promise) {
        promise && promise.abort && promise.abort();
    }

    function initDataSource(selector) {
        var options = selector._options;
        // set default data source if not set already
        if (!options.dataSource) {
            if (options.url) {
                options.dataSource = new PagedDataSource(options.url, options.urlParams);
            } else {
                throw new Error("either a dataSource or url must be supplied");
            }
        }

        options.dataSource = new DelayedDataSource(options.dataSource, options.debounceInterval);
    }

    function initSelect2(selector) {
        var options = selector._options;
        var $field = selector._$field;
        var excludedIds = selector._excludedIds;

        // Curry the options parameter
        var toSelect2Entity = _.bind(convertToSelect2Entity, null, options);

        var currentPromises = [];
        $field.auiSelect2({
            hasAvatar: options.hasAvatar,
            query: function query(opts) {

                // clear paging indices for new search
                if (opts.page <= 1) {
                    options.dataSource.clear();
                    _.forEach(currentPromises, maybeAbort);
                    currentPromises = [];
                }

                var filter = options.prepareSearchTerm($.trim(opts.term));
                var currentPromise = options.dataSource.nextPage(filter);
                currentPromise = currentPromise.then(function (page) {
                    return {
                        results: _.chain(page.values).map(toSelect2Entity).filter(function (entity) {
                            return _.indexOf(excludedIds, entity.id) === -1;
                        }).value(),
                        more: !page.isLastPage
                    };
                }).promise(currentPromise);

                currentPromises.push(currentPromise);
                currentPromise.always(function () {
                    currentPromises = _.reject(currentPromises, fn.eq(currentPromise));
                }).done(opts.callback);
            },
            formatSelection: function formatSelection(entity) {
                return options.selectionTemplate(entity.item);
            },
            formatResult: function formatResult(entity) {
                return options.resultTemplate(entity.item);
            },
            initSelection: function initSelection(element, callback) {
                var select2Entities = _.map(selector._initialItems, toSelect2Entity);
                selector._selectedItems = select2Entities;
                callback(select2Entities);
            },
            separator: '|!|', // shouldn't be used
            multiple: true,
            minimumInputLength: options.minimumInputLength,
            formatInputTooShort: options.inputTooShortTemplate,
            formatNoMatches: options.noMatchesTemplate,
            formatSearching: options.searchingTemplate,
            containerCssClass: ['searchable-multi-selector', options.extraClasses].join(' '),
            dropdownCssClass: ['searchable-multi-selector-dropdown', options.dropdownClasses].join(' '),
            openOnEnter: false
        }).on("change", function (changeEvent) {
            if (changeEvent.removed) {
                selector._selectedItems = reject(selector._selectedItems, changeEvent.removed);
            }
            if (changeEvent.added) {
                selector._selectedItems.push(changeEvent.added);
            }
            selector.trigger('change'); // bubble the event to the selector
        }).on("open", _.bind(showNoResultsIfAllDisabled, null, this));
    }

    return SearchableMultiSelector;
});