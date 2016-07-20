'use strict';

define('bitbucket/internal/widget/searchable-selector', ['aui', 'jquery', 'lodash', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/dom-event', 'bitbucket/internal/util/events', 'bitbucket/internal/util/navigator', 'bitbucket/internal/util/promise', 'bitbucket/internal/widget/keyboard-controller', 'bitbucket/internal/widget/paged-scrollable'], function (AJS, $, _, ajax, domEvent, events, navigatorUtil, promiseUtil, keyboardControllers, PagedScrollable) {

    'use strict';

    var TabKeyboardController = keyboardControllers.TabKeyboardController;
    var ListKeyboardController = keyboardControllers.ListKeyboardController;
    var instanceCount = 0;

    /**
     * A generic searchable selector, with optional support for multiple tabbed lists of results
     * @return {SearchableSelector} The new SearchableSelector instance
     *
     * @param {HTMLElement|jQuery}  trigger     The trigger (usually a button) to bind opening the selector to.
     * @param {Object}              options     A hash of options, valid options are specified in SearchableSelector.prototype.defaults
     */
    function SearchableSelector(trigger, options) {
        return this.init.apply(this, arguments);
    }

    /**
     * Default options.
     * All options can also be specified as functions that return the desired type (except params that expect a function).
     *
     * @property {string}   id                     The id for the dialog container.
     * @property {string}   extraClasses           Any extraClasses to apply to the dialog container.
     * @property {string}   namespace              The namespace used when generating unique ids for components
     * @property {string}   url                    The URL of the rest endpoint.
     * @property {Array}    tabs                   An array of tabs (JSON objects) specifying the configuration of the tabs (if any) which override the global options. Any missing tab configuration is filled from the global options.
     *                                              Tabs can supply the following options ['label', 'url', 'resultsTemplate', 'noResultsText', 'noMoreResultsText', 'dataTransform', 'queryParamKey', 'preloadData', 'searchPlaceholder']
     * @property {boolean}  searchable             Whether to show the search field.
     * @property {string}   searchPlaceholder      The placeholder text in the search field.
     * @property {string}   queryParamKey          The query param that should be used when sending the search value to the server, if using the default queryParamsBuilder.
     * @property {function} queryParamsBuilder     A function that returns query params as an object. The function is passed (searchTerm, start, limit).
     *                                          Return null to indicate a request should not be sent at all.
     *                                          Use this instead of the queryParamKey option for multiple query params.
     * @property {number}   pageSize               The number of items returned per page
     * @property {Object}   statusCodeHandlers     JSON Object specifying any custom handlers for AJAX error codes.
     * @property {boolean}  followLinks            Whether clicking an item (link) in the list should navigate to it's url
     * @property {boolean}  hideDialogOnSelect     Whether to hide the dialog after an item is selected.
     * @property {string}   itemSelectedEvent      The name of the Event to fire when an item is selected
     * @property {*}        context                Extra value of any type to be added to the `itemSelectedEvent`.
     * @property {HTMLElement|jQuery} field        input field to be kept up to date with the id of the selected item.
     * @property {string}   itemDataKey      The key of the data attribute storing the item's JSON object. The data-attribute should be on items in the trigger content and each result.
     * @property {function} template               The template for rendering the whole selector (is appended to the AJS.InlineDialog)
     * @property {function} resultsTemplate        The template for rendering the results (is appended to the `ul.results-list`). Must return a collection of `li>a` with a `data-id` attribute as a minimum.
     * @property {string}   noResultsText          The text to be displayed when there are no results at all. Defaults to the value in the soy template.
     * @property {string}   noMoreResultsText      The text to be displayed when the last results has been shown. Defaults to the value in the soy template.
     * @property {function} triggerContentTemplate The template for rendering the _content_ of the trigger (when updating the trigger after selection)
     * @property {string}   triggerPlaceholder     The plain text to use for the trigger when no selection has been made
     * @property {Object}   preloadData            A page of data in the same shape as the REST response to be preloaded into the selector. Use the `SearchableSelector.constructDataPageFromPreloadArray` helper if you want to use a simple array
     * @property {boolean}  alwaysShowPreload      Whether to always show the preloaded data, even when searching (may not match the current query)
     * @property {function} dataTransform          The default soy template expects data in the form {values: [{name, id, url?}], isLastPage, limit, size, start}
     *                                              If you want to use it, and your data doesn't fit this shape, you can write a data transform.
     *                                              Make sure to clone objects in your transform if you don't want to mess up your original dataset.
     *                                              `dataTransform` will be `call`ed in the context of the current selector with the arguments (data, searchTerm)
     * @property {HTMLElement|jQuery} externalSearchField  A field external to the dialog contents that is used as the search field
     * @property {boolean}  clearResultsOnSearch   Whether to clear previous results immediately when searching, or to wait for some results (preload or otherwise) to be ready
     * @property {number}  popUpOffsetX   the horizontal offset for the AJS.InlineDialog popup element
     * @property {number}  popUpOffsetY   the vertical offset for the AJS.InlineDialog popup element
     * @property {number} width           the default width for all searchable selector (the default was 300 from aui, which is not align to ADG's default widths)
     */
    SearchableSelector.prototype.defaults = {
        id: null,
        extraClasses: null,
        namespace: 'searchable-selector',
        url: null,
        tabs: null,
        searchable: true,
        searchPlaceholder: null,
        queryParamKey: 'filter',
        queryParamsBuilder: null,
        pageSize: 20,
        statusCodeHandlers: {}, //By default use global AJAX error handlers
        followLinks: false,
        hideDialogOnSelect: true,
        itemSelectedEvent: 'bitbucket.internal.widget.searchableSelector.itemSelected',
        context: null,
        field: null,
        itemDataKey: 'item',
        template: bitbucket.internal.widget.searchableSelector,
        resultsTemplate: bitbucket.internal.widget.searchableSelectorResults,
        noResultsText: null,
        noMoreResultsText: null,
        triggerContentTemplate: bitbucket.internal.widget.searchableSelectorTriggerContent,
        triggerPlaceholder: null, //Use the one in the soy template by default.
        preloadData: null,
        alwaysShowPreload: false,
        dataTransform: null,
        postOptionsInit: null,
        clearResultsOnSearch: true,
        popUpOffsetX: 0,
        popUpOffsetY: -1,
        width: 350 // NOTE: the default was 300 from aui, which is not align to ADG's default widths
    };

    /**
     * Helper function for creating REST pages from an array of JSON objects.
     * Useful for supplying preloaded data
     * @return {Object} The REST page
     *
     * @param {Array} preloadArray  An array of JSON items to be preloaded into the selector
     */
    SearchableSelector.constructDataPageFromPreloadArray = function (preloadArray) {
        if (!_.isArray(preloadArray)) {
            return null;
        }

        return {
            values: preloadArray,
            isLastPage: false,
            size: preloadArray.length,
            start: 0,
            limit: preloadArray.length
        };
    };

    /**
     * The array of options that can be set by tabs
     */
    SearchableSelector.prototype.tabOptionKeys = ['label', 'url', 'resultsTemplate', 'noResultsText', 'noMoreResultsText', 'dataTransform', 'queryParamKey', 'preloadData', 'searchPlaceholder'];

    /**
     * Initialise the selector
     * @return {SearchableSelector} The initialised SearchableSelector.
     *
     * @param {HTMLElement|jQuery}  trigger     The trigger (usually a button) to bind opening the selector to.
     * @param {Object}              options     A hash of options, valid options are specified in SearchableSelector.prototype.defaults
     */
    SearchableSelector.prototype.init = function (trigger, options) {
        var searchableSelector = this;
        this.instanceId = instanceCount++;

        this.$trigger = $(trigger);
        this.setOptions(options);
        this.scrollables = [];
        this.scrollableDataStores = []; //Multi-dimensional array storing the full data for the displayed results for each scrollable.

        if (!this._getOptionVal('id')) {
            //no id was supplied and we need a unique id for when there are multiple selectors on the page.
            this.options.id = this._getOptionVal('namespace') + '-' + this.instanceId;
        }

        if (this.options.tabs && this.options.tabs.length) {
            this.tabs = _.map(this.options.tabs, function (tab) {
                //Use global options if tab specific option is not supplied
                return $.extend(true, {}, _.pick(searchableSelector.options, searchableSelector.tabOptionKeys), tab);
            });
        }
        var postOptionsInit = this._getOption('postOptionsInit');
        if (_.isFunction(postOptionsInit)) {
            postOptionsInit.call(this);
        }

        var blockShortcutPropagation;
        this.blockShortcutPropagation = blockShortcutPropagation = function blockShortcutPropagation(e) {
            //Stop keyboard shortcuts from affecting other elements, handle "close on escape" logic.
            var isDocument = this === document;

            if (e.keyCode === AJS.keyCode.ESCAPE) {
                // If the selector is in a modal dialog, We want to only close the selector
                // They should be able to hit ESC again to close the modal dialog
                e[isDocument ? 'stopImmediatePropagation' : 'stopPropagation']();
                searchableSelector.dialog.hide();
            } else if (!isDocument) {
                //Stop any other shortcuts from the dialog leaking to it's parents, but allow other handlers bound on the dialog to run.
                e.stopPropagation();
            }
        };

        var externalSearchField = searchableSelector._getOptionVal('externalSearchField');
        this.dialog = AJS.InlineDialog(this.$trigger, this._getOptionVal('id'), function ($content, trigger, showPopup) {
            if (!$content.data('initialised')) {
                searchableSelector._initialiseDialogContent($content);
            }

            showPopup();

            if (!externalSearchField) {
                _.defer(_.bind(searchableSelector.setFocus, searchableSelector));
            }
        }, {
            offsetX: this._getOptionVal('popUpOffsetX'),
            offsetY: this._getOptionVal('popUpOffsetY'),
            noBind: !!externalSearchField, // Don't show dialog when clicking on an external search field
            width: this._getOptionVal('width'),
            hideCallback: function hideCallback() {
                // Note: If implementing a dropdown2 (or any other button) where a user can click to from a searchable-selector,
                // Clicking a button doesn't focus it and therefore, this will focus back the searchable selector trigger
                // If its a dropdown2 trigger, the dropdown will be hidden immediately
                // A setTimeout cannot be used because the browser automatically blurs focus to the body if focused element is hidden - Xu
                if (searchableSelector.$content.is(document.activeElement) || $.contains(searchableSelector.$content[0], document.activeElement)) {
                    // if the focus is inside the dialog, you get stuck when it closes. Focus the trigger instead.
                    searchableSelector.$trigger.focus();
                }

                $(document).add(searchableSelector.dialog).off('keydown keypress', blockShortcutPropagation);
            },
            initCallback: function initCallback() {
                // Bind to both the document and the inline dialog because we need to stop
                // the bubbling of the event before it reaches the document as to trigger
                // other ESC handlers. We listen for keydown because that is what AUI is doing
                // in dialog.js and keypress for whenIType.
                $(document).add(searchableSelector.dialog).on('keydown keypress', blockShortcutPropagation);
            }
        });

        if (this._getOptionVal('searchable') && externalSearchField) {
            this.$searchField = $(externalSearchField);
            this._initialiseSearchOnInput();
        }

        if (this.$trigger.find('.name').length) {
            //Trigger already has a valid selection
            this._selectedItem = this._getItemFromTrigger();
        }

        AJS.bind('hide.dialog', function (e, data) {
            if (searchableSelector.$trigger.closest(data.dialog.popup.element).length) {
                searchableSelector.dialog.hide();
            }
        });

        return this;
    };

    /**
     * Get the currently selected item.
     * @return {Object} The selected item.
     */
    SearchableSelector.prototype.getSelectedItem = function () {
        return this._selectedItem;
    };

    /**
     * Set the selected item.
     * Updates the trigger and fires the event if the item is different to the previous item.
     *
     * @param {Object} item The item to select.
     */
    SearchableSelector.prototype.setSelectedItem = function (item) {
        if ($.isPlainObject(item) && item.id != null) {
            //Because the searchable selector accepts JSON objects, this is the best verification we can do on the incoming item
            if (!this._selectedItem || this._selectedItem.id !== item.id) {
                //Either there was no item previously selected, or the new item is different from the current one.
                this._itemSelected(item);
            }
        }
    };

    /**
     * Clear the currently selected item
     */
    SearchableSelector.prototype.clearSelection = function () {
        this._selectedItem = null;

        if (this._getOptionVal('field')) {
            $(this._getOptionVal('field')).val('');
        }
        this.resetTrigger();
    };

    /**
     * Build a JSON representation of the item from the metadata on the trigger.
     * @return {Object} The JSON object representation of the item.
     */
    SearchableSelector.prototype._getItemFromTrigger = function () {
        var $triggerItem = this.$trigger.find('.name');
        return $.extend({}, this._buildObjectFromElementDataAttributes($triggerItem), { name: $triggerItem.text() });
    };

    /**
     * Retrieve the JSON representation of the item from the data-attribute of a dom element.
     * The option 'itemDataKey' is used as the key for the data-attribute.
     * @return {Object} The hash of data attributes
     *
     * @param {HTMLElement|jQuery} elem     The element to extract the data from.
     */
    SearchableSelector.prototype._buildObjectFromElementDataAttributes = function (elem) {
        return $(elem).data(this._getOptionVal('itemDataKey'));
    };

    /**
     * Create and insert the initial content for the selector dialog.
     * Set up event bindings for tabs, searching and keyboard shortcuts.
     * Create PagedScrollables for each tab and initialise the first one.
     *
     * @param {jQuery}  $content    The body element of the AJS.InlineDialog.
     */
    SearchableSelector.prototype._initialiseDialogContent = function ($content) {
        var searchableSelector = this;
        var searchable = this._getOptionVal('searchable');
        var externalSearchField = this._getOptionVal('externalSearchField');

        $content.append(this._getOption('template')({
            id: this._getOptionVal('id'),
            tabs: this.tabs,
            searchable: !externalSearchField && searchable,
            searchPlaceholder: this._getOptionVal('searchPlaceholder'),
            extraClasses: this._getOptionVal('extraClasses')
        }));

        $content.closest('.aui-inline-dialog').addClass('searchable-selector-dialog');

        if (searchable && !externalSearchField) {
            this.$searchField = $content.find('input.filter');
            this._initialiseSearchOnInput();
        }

        if (this.tabs) {
            var $tabLinks = $content.find('ul.tabs-menu a');

            $tabLinks.on('tabSelect', function (e, elements) {
                searchableSelector.currentTabId = elements.tab.parent().data('tab-id');

                if (searchableSelector._getOptionVal('searchable') || searchableSelector._getDataStoreForScrollable().length === 0) {
                    //Always reinitialise the scrollable when search is enabled, but only do it once otherwise.
                    //Will reload empty tabs on switch, but that's acceptable because there is no selection/position to maintain anyway.
                    searchableSelector._populateScrollable();
                }

                searchableSelector._resultsKeyboardController.setListElement(searchableSelector._getCurrentScrollable().$scrollElement.find('ul.results-list'));

                if (searchable) {
                    searchableSelector.$searchField.focus();
                }

                searchableSelector._updateSearchPlaceholder();
            });

            $tabLinks.on('click', function (e) {
                if ($(this).parent().hasClass('active-tab')) {
                    //Prevent reload of current tab
                    e.stopPropagation();
                    e.preventDefault();
                }
            });

            $tabLinks.on('keydown', function (e) {
                if (e.keyCode === AJS.keyCode.ENTER) {
                    var $this = $(this);

                    if ($this.parent('li').hasClass('active-tab')) {
                        //Don't reload current tab
                        e.preventDefault();
                    } else {
                        $this.click();
                    }
                }
            });

            AJS.tabs.setup();
        }

        $content.find('.results').each(function () {
            searchableSelector.scrollables.push(searchableSelector._createScrollable($(this)));
            searchableSelector.scrollableDataStores.push([]);
        });

        $content.on('click', '.result a', function (e) {
            searchableSelector.selectItem(e, $(this));
        });

        this._initialiseKeyboardNavigation($content);
        this._initialiseMouseNavigation($content);

        this._populateScrollable();

        this.$content = $content;

        $content.data('initialised', true);
    };

    /**
     * Set up keyboard bindings on the searchField for searching
     */
    SearchableSelector.prototype._initialiseSearchOnInput = function () {
        var searchableSelector = this;
        var currSearchTerm = this._getSearchTerm();
        var externalSearchField = this._getOptionVal('externalSearchField');
        var delayedSearch = promiseUtil.delay(_.bind(this._handleSearchInput, this), 350);
        var searchIfTermChanged = _.bind(function () {
            if (currSearchTerm !== (currSearchTerm = this._getSearchTerm())) {
                if (!this._pendingSearch) {
                    this._pendingSearch = delayedSearch(currSearchTerm);
                    this._pendingSearch.always(function () {
                        searchableSelector._pendingSearch = null;
                    });
                } else {
                    this._pendingSearch.reset(currSearchTerm);
                }
            }
        }, this);

        // Need to bind to keydown so that a _pendingSearch is created ASAP.
        // KeyboardController also binds to keydown and we need to check for the presence of _pendingSearch
        // when the user presses Enter.
        this.$searchField.on('keydown.searchable-selector input.searchable-selector', _.bind(function (e) {
            if (externalSearchField) {
                if (e.which === AJS.keyCode.ESCAPE) {
                    this._pendingSearch && this._pendingSearch.abort();
                } else if (e.which === AJS.keyCode.DOWN && this._shouldSearch(currSearchTerm)) {
                    this.dialog.show();
                } else if (e.which === AJS.keyCode.ENTER && !this.dialog.is(':visible')) {
                    // Special case when typing and immediately pressing enter while dialog is not visible.
                    // The enter key is not picked up by the KeyboardController because it is not yet initialised.
                    this._pendingSearch && this._pendingSearch.done(function () {
                        var $firstResult = searchableSelector._getCurrentScrollable().$scrollElement.find('ul.results-list li.result:first');
                        searchableSelector._clickItem($firstResult);
                    });
                }
            }

            // The input's value only changes after the keydown event fires
            _.defer(searchIfTermChanged);
        }, this));
    };

    /**
     * Handle typing in the search field
     *
     * @return {Promise} Promise for the first page of results. A rejected promise is returned if a search is not performed.
     */
    SearchableSelector.prototype._handleSearchInput = function (currSearchTerm) {
        var externalSearchField = this._getOptionVal('externalSearchField');
        if (externalSearchField) {
            if (this._shouldSearch(currSearchTerm)) {
                if (!this.dialog.is(':visible')) {
                    this.dialog.show();
                }
                return this._populateScrollable();
            } else {
                this.dialog.hide();
                return $.Deferred().reject().promise();
            }
        } else {
            return this._populateScrollable();
        }
    };

    /**
     * Set up the keyboard navigation controllers
     *
     * @param {jQuery} $context The container to apply the keyboard shortcuts to.
     */
    SearchableSelector.prototype._initialiseKeyboardNavigation = function ($context) {
        var searchableSelector = this;
        var $listEventTarget;
        var listEventTargetIsTrigger = false;
        var select = function select($result) {
            var dialogVisible = searchableSelector.dialog.is(':visible');

            // Ignore selections if the search field is external and the dialog is not visible
            if (searchableSelector._getOptionVal('externalSearchField') && !dialogVisible) {
                return;
            }

            if (listEventTargetIsTrigger && !dialogVisible) {
                searchableSelector.$trigger.click();
            } else {
                searchableSelector._clickItem($result);
            }
        };

        if (this._resultsKeyboardController) {
            this._resultsKeyboardController.destroy();
        }

        if (this.$searchField) {
            $listEventTarget = this.$searchField;
        } else if (this.tabs) {
            $listEventTarget = $context.find('ul.tabs-menu');
        } else {
            $listEventTarget = this.$trigger;
            listEventTargetIsTrigger = true;
        }

        var $resultsList = searchableSelector._getCurrentScrollable().$scrollElement.find('ul.results-list');
        this._resultsKeyboardController = new ListKeyboardController($listEventTarget, $resultsList, {
            wrapAround: false,
            focusedClass: 'focused',
            itemSelector: 'li.result',
            requestMore: function requestMore() {
                var loadAfterPromise = searchableSelector._getCurrentScrollable().loadAfter();
                return loadAfterPromise && loadAfterPromise.then(function (data) {
                    return data.isLastPage;
                });
            },
            onSelect: function onSelect($focused) {
                if (searchableSelector._pendingSearch) {
                    // Wait for search to complete and select the first result
                    searchableSelector._pendingSearch.done(function () {
                        var $firstResult = $resultsList.find('li.result:first');
                        if ($firstResult.length) {
                            select($firstResult);
                        }
                    });
                } else {
                    select($focused);
                }
            },
            focusIntoView: true,
            adjacentItems: searchableSelector._getOptionVal('adjacentItems')
        });

        if (this._tabKeyboardController) {
            this._tabKeyboardController.destroy();
        }

        // Making tab focus styles override well in IE is super hard (no outline-offset support)
        // Safari and FF styles suck, so override them with our primary color
        if (navigatorUtil.isMozilla() || navigatorUtil.isWebkit()) {
            $context.addClass('override-focus-style');
        }

        this._tabKeyboardController = new TabKeyboardController($context);
    };

    /**
     * Set up the mouse navigation focus events
     *
     * @param {jQuery} $context The container that contains the menu items to bind the mouse events to.
     */
    SearchableSelector.prototype._initialiseMouseNavigation = function ($context) {
        var focusedClass = 'focused';

        $context.on('mousemove', 'li', function () {
            // return early if element already has the focused class
            if ($(this).find('.' + focusedClass).hasClass(focusedClass)) {
                return;
            }
            $context.find('.' + focusedClass).removeClass(focusedClass);
            $(this).addClass(focusedClass);
        });
    };

    SearchableSelector.prototype._clickItem = function ($result) {
        $result.children('a').each(function () {
            // Use Element.click instead of jQuery's click to click through to the href of links
            this.click();
        });
    };

    /**
     * Set the initial focus when showing the dialog for the first time
     */
    SearchableSelector.prototype.setFocus = function () {
        if (this.$searchField) {
            this.$searchField.focus();
        } else if (this.tabs) {
            this.$content.find('ul.tabs-menu a').first().focus();
        } else {
            this.$trigger.focus();
        }
    };

    /**
     * Created a new {PagedScrollable}
     * @returns {PagedScrollable}
     *
     * @param {jQuery} $scrollEl    The container with overflow:hidden that gets scrolled
     */
    SearchableSelector.prototype._createScrollable = function ($scrollEl) {
        var scrollable = new PagedScrollable($scrollEl, {
            pageSize: this._getOptionVal('pageSize'),
            bufferPixels: 0,
            preventOverscroll: true,
            paginationContext: this.options.paginationContext
        });

        scrollable.requestData = _.bind(this.getResults, this, scrollable);

        scrollable.attachNewContent = _.bind(this.addResultsToList, this, scrollable, false); //attachNewContent is never triggered for preloadData

        return scrollable;
    };

    /**
     * Load the first page of data (including any preload data) into the scrollable.
     *
     * @param {PagedScrollable} scrollable  The scrollable to populate
     *
     * @return {Promise} Resolved when the first page of data (could be preload data) is loaded.
     */
    SearchableSelector.prototype._populateScrollable = function (scrollable) {
        scrollable = scrollable || this._getCurrentScrollable();
        this._emptyScrollable(scrollable);

        var preloadData = this._getPreloadData();
        var preloadResultsAdded = 0;

        if (preloadData) {
            preloadResultsAdded = this.addResultsToList(scrollable, true, preloadData);
        }

        var searchDeferred = scrollable.init();
        if (preloadResultsAdded > 0) {
            return $.Deferred().resolve().promise();
        } else {
            return searchDeferred;
        }
    };

    /**
     * Get the preload data (if appropriate) for the selector
     * @return {Object} The preload data
     */
    SearchableSelector.prototype._getPreloadData = function () {
        var preloadData = this._getOptionVal('preloadData');
        var searchTerm = this._getSearchTerm();

        if (preloadData && (this._getOptionVal('alwaysShowPreload') || searchTerm === '')) {
            //Only show the preloaded data when there is no search term, unless explicitly told to.
            var dataTransform = this._getOption('dataTransform');

            if (_.isFunction(dataTransform)) {
                preloadData = dataTransform.call(this, preloadData, searchTerm);
            }
        } else {
            preloadData = null;
        }

        return preloadData;
    };

    /**
     * Remove all the items from the results list, empty the accompanying datastore and reset the scrollable.
     *
     * @param {PagedScrollable} scrollable  The scrollable to empty.
     */
    SearchableSelector.prototype._emptyScrollable = function (scrollable) {
        scrollable = scrollable || this._getCurrentScrollable();
        scrollable.reset();
        this._getDataStoreForScrollable(scrollable).length = 0;
        if (this._getOptionVal('clearResultsOnSearch')) {
            scrollable.$scrollElement.children('ul.results-list').empty();
        }
    };

    /**
     * Get the scrollable for the currently selected tab (or return the only scrollable if there is <= 1 tab)
     * @return {PagedScrollable}    The scrollable for the current tab.
     */
    SearchableSelector.prototype._getCurrentScrollable = function () {
        return this.scrollables[this.tabs && this.currentTabId ? this.currentTabId : 0];
    };

    /**
     * Get the data store (the in-memory collection of the results that are being displayed) for a scrollable.
     * @return {Array|null} The collection of results
     */
    SearchableSelector.prototype._getDataStoreForScrollable = function (scrollable) {
        if (!scrollable) {
            //If no scrollable is supplied, return the data store for the current one.
            return this.scrollableDataStores[this.tabs && this.currentTabId ? this.currentTabId : 0];
        }

        var scrollableIndex = _.indexOf(this.scrollables, scrollable);

        if (scrollableIndex !== -1) {
            return this.scrollableDataStores[scrollableIndex];
        } else {
            return null;
        }
    };

    /**
     * Get the current input from the search field if searching is enabled.
     * @return {string} The search term
     */
    SearchableSelector.prototype._getSearchTerm = function () {
        return this.$searchField ? this.$searchField.val() : '';
    };

    /**
     * Update the placeholder shown when the search field is empty. Called when the active tab is changed.
     */
    SearchableSelector.prototype._updateSearchPlaceholder = function () {
        if (this.$searchField) {
            this.$searchField.attr('placeholder', this._getOptionVal('searchPlaceholder'));
        }
    };

    /**
     * Get the value of an option, if the option is a function, then evaluate the function and return the result.
     * If the current tab has specified an option that overrides the base configuration, that value will be used.
     * @return {*} The value of the option
     *
     * @param {string} key  The name of the option
     */
    SearchableSelector.prototype._getOptionVal = function (key) {
        // Use when you want an option of any sort (tab overrideable or not) and you want to evaluate the option if it's a function.
        return this._getOption(key, true);
    };

    /**
     * Get the value of an option. If the option is a function, it can be evaluated rather than returned if opt_evaluate is true.
     * If the current tab has specified an option that overrides the base configuration, that value will be used.
     * @return {*} The value of the option
     *
     * @param {string} key              The name of the option
     * @param {boolean} opt_evaluate    Whether to evaluate or just return options that resolve to functions. False by default
     */
    SearchableSelector.prototype._getOption = function (key, opt_evaluate) {
        //Use when you want an option that may be set in the config for a tab
        //By default it won't evaluate functions, just return them
        var option;

        if (this.tabs && _.contains(this.tabOptionKeys, key)) {
            option = this.tabs[this.currentTabId || 0][key];
        } else {
            option = this.options[key];
        }

        return opt_evaluate ? getRawOrFunctionVal(option, this) : option;
    };

    /**
     * Override the below (if you need to) for custom selector implementations
     */

    /**
     * Merge the supplied options with the defaults.
     */
    SearchableSelector.prototype.setOptions = function (options) {
        this.options = $.extend(true, {}, this.defaults, options);
    };

    /**
     * Fetch another page of results to display in the scrollable
     * @return {Promise}
     *
     * @param {PagedScrollable} scrollable  The scrollable to retrieve the page for.
     * @param {number}          start       The index of the first result to retrieve.
     * @param {number}          limit       The number of results to retrieve.
     */
    SearchableSelector.prototype.getResults = function (scrollable, start, limit) {
        var searchableSelector = this;

        if (this.currentXHR && this.currentXHR.abort) {
            this.currentXHR.abort();
        }

        var queryParamsBuilder = this._getOption('queryParamsBuilder') || this._defaultQueryParamsBuilder;
        var searchData = queryParamsBuilder.call(this, this._getSearchTerm(), start, limit);
        if (searchData === null) {
            return $.Deferred().reject().promise();
        }

        var $resultsList = scrollable.$scrollElement.children('ul.results-list');
        this._showSpinner(scrollable);
        $resultsList.scrollTop($resultsList[0].scrollHeight);

        var currentXHR = this.currentXHR = ajax.rest({
            url: this._getOptionVal('url'),
            data: searchData,
            statusCode: this._getOptionVal('statusCodeHandlers')
        });
        currentXHR.always(function () {
            searchableSelector._hideSpinner(scrollable);
            searchableSelector.currentXHR = null;
        });

        return currentXHR;
    };

    SearchableSelector.prototype._showSpinner = function (scrollable) {
        scrollable.$scrollElement.children('.spinner').show().spin();
    };

    SearchableSelector.prototype._hideSpinner = function (scrollable) {
        scrollable.$scrollElement.children('.spinner').spinStop().hide();
    };

    /**
     * Tests the queryParamsBuilder to see if a request should be sent for the given searchTerm
     *
     * @param searchTerm
     */
    SearchableSelector.prototype._shouldSearch = function (searchTerm) {
        var queryParamsBuilder = this._getOption('queryParamsBuilder') || this._defaultQueryParamsBuilder;
        return queryParamsBuilder.call(this, searchTerm, 0, this._getOptionVal('pageSize')) != null;
    };

    SearchableSelector.prototype._defaultQueryParamsBuilder = function (searchTerm, start, limit) {
        var params = {
            start: start,
            limit: limit
        };
        if (this._getOptionVal('searchable')) {
            params[this._getOptionVal('queryParamKey')] = searchTerm;
        }
        return params;
    };

    /**
     * Render a page of results and append them to the list inside a scrollable.
     *
     * @param {PagedScrollable} scrollable  The scrollable to add the results to.
     * @param {boolean}         isPreload   Whether the results are from preloaded data or a REST request.
     * @param {Object}          data        The REST page response.
     *
     * @return {number} The number of results actually added - after transforming and de-duping
     */
    SearchableSelector.prototype.addResultsToList = function (scrollable, isPreload, data) {
        var dataTransform = this._getOption('dataTransform');
        var preloadData;

        if (_.isFunction(dataTransform)) {
            data = dataTransform.call(this, data, this._getSearchTerm());
        }

        if (!isPreload && (preloadData = this._getPreloadData())) {
            //there is preloaded data and this is a non-preload dataset, so dedupe it
            data = this.dedupeData(data, preloadData);
        }

        data = $.extend({}, data, {
            isPreload: isPreload,
            noResultsText: this._getOptionVal('noResultsText'),
            noMoreResultsText: this._getOptionVal('noMoreResultsText')
        });

        var newResults = $(this._getOption('resultsTemplate')(data));
        var scrollableDataStore = this._getDataStoreForScrollable(scrollable);
        scrollableDataStore.push.apply(scrollableDataStore, data.values);

        var $resultsList = scrollable.$scrollElement.children('ul.results-list');
        // First page of data - either preload or not. It can be an empty page if it's not preload data.
        var isFirstPage = data.start === 0 && !(preloadData && preloadData.size > 0) && (!isPreload || data.size > 0);

        if (isFirstPage) {
            $resultsList.empty();
        }
        $resultsList.append(newResults).attr('data-last-updated', new Date().getTime());

        if (isFirstPage && data.size > 0) {
            //This is either the preload data, or the first page of data that wasn't preceded by preload data,
            //so select the first item in the results.
            this._resultsKeyboardController.moveToNext();
        }

        return data.size;
    };

    /**
     * Remove any duplicates that exist between the preload data and any REST responses.
     * Results are duplicate if they have the same 'id'
     * @return {Object} The deduped data.
     *
     * @param {Object} data         The REST data to be deduped.
     * @param {Object} preloadData  The preload data to check the REST data against for dupes.
     */
    SearchableSelector.prototype.dedupeData = function (data, preloadData) {
        if (data && data.values && preloadData && preloadData.values) {
            data = $.extend(true, {}, data); //Clone data so source data is left unfiltered

            data.values = _.reject(data.values, function (result) {
                return _.find(preloadData.values, function (preloadResult) {
                    return result.id === preloadResult.id;
                });
            });
        }

        return data;
    };

    /**
     * Find the clicked item and follow it's link if `followLinks` is enabled,
     * else pass the item on to `_itemSelected` for further handling.
     * Hide the dialog if `hideDialogOnSelect` is true.
     *
     * @param {Event}   e   The click event
     * @param {jQuery}  $el The jQuery wrapped element that was clicked.
     */
    SearchableSelector.prototype.selectItem = function (e, $el) {
        var selectedItemId = $el.data('id');
        var itemData = _.find(this._getDataStoreForScrollable(), function (result) {
            return result.id === selectedItemId;
        });

        if ($el.attr('href') !== '#' && (this._getOptionVal('followLinks') || !domEvent.openInSameTab)) {
            // Allow browser to follow link, if `followLinks` is true, or if it is a click to open in a new tab.
            // It's pointless to allow the browser to follow the link, regardless of options, if the href is '#'
        } else {
                e.preventDefault();
            }

        if (!this._selectedItem || this._selectedItem.id !== itemData.id) {
            //Only process the selection if it's different to the currently selected item.
            this._itemSelected(itemData);
        }

        if (this._getOptionVal('hideDialogOnSelect')) {
            this.dialog.hide();
        }
    };

    /**
     * Handle an item being selected.
     * Triggers the `itemSelectedEvent` event with the item,
     * sets the selectedItem to the item and updates the trigger and form field (if supplied)
     *
     * @param {Object}  itemData     The JSON data for the selected item.
     */
    SearchableSelector.prototype._itemSelected = function (itemData) {
        this._selectedItem = itemData;

        if (this._getOptionVal('field')) {
            $(this._getOptionVal('field')).val(itemData.id);
        }

        this.updateTrigger({ item: itemData });

        events.trigger(this._getOptionVal('itemSelectedEvent'), this, itemData, this._getOptionVal('context'));
    };

    /**
     * Update the contents of the trigger with the `triggerContentTemplate`, unless `externalSearchField` is used.
     *
     * @param {Object} templateData     The data to use to render the template. It should have either an `item` or `text` property.
     * @param {string} [titleContent]   The new title to be used for the trigger element.
     */
    SearchableSelector.prototype.updateTrigger = function (templateData, titleContent) {
        if (!this._getOptionVal('externalSearchField')) {
            this.$trigger.html(this._getOption('triggerContentTemplate')(templateData || {}));
            if (titleContent) {
                this.$trigger.attr('title', titleContent);
            }
        }
        this.$trigger.trigger("change");
    };

    /**
     * Reset the contents of the trigger to the `triggerPlaceholder`
     */
    SearchableSelector.prototype.resetTrigger = function () {
        this.updateTrigger({ text: this._getOptionVal('triggerPlaceholder') });
    };

    /**
     * Destroy the selector (calling code should also null out their reference to the instance)
     * Unfortunately this won't unbind the events that AJS.InlineDialog listens for on the trigger,
     * so you really need to .remove() the trigger from the DOM after calling this.
     */
    SearchableSelector.prototype.destroy = function () {
        if (this.blockShortcutPropagation) {
            $(document).add(this.dialog).off('keydown keypress', this.blockShortcutPropagation);
        }
        if (this._getOptionVal('externalSearchField')) {
            this.$searchField.off('.searchable-selector');
        }
        if (this.dialog) {
            this.dialog.hide();
            this.dialog.remove();
            this.dialog = null;
        }
        if (this._resultsKeyboardController) {
            this._resultsKeyboardController.destroy();
            this._resultsKeyboardController = null;
        }
        if (this._tabKeyboardController) {
            this._tabKeyboardController.destroy();
            this._tabKeyboardController = null;
        }
        this.$trigger = null;
        this.scrollables = null;
        this.scrollableDataStores = null;
        this.tabs = null;

        this._initialiseDialogContent = $.noop; //Hack to stop InlineDialog trying to repopulate the dialog in a busted state.
    };

    /**
     * Return the value passed in, unless it's a function, in which case call the function and return the result.
     * Calls any functions in the given context.
     * @return {*} The value or result of the function call.
     *
     * @param {*}       prop    The value to return or execute
     * @param {Object}  context The context to execute the function in, defaults to global
     */
    function getRawOrFunctionVal(prop, context) {
        //Assuming the function should be called in the context of the current selector instance is a little magic,
        //but otherwise it's impossible to pass in functions that execute in the context of the current instance in the options.
        //We can revisit this if we hit the use case where the supplied function is to be executed against something other than the current instance
        //or globally (in which case the context is probably unused)
        return _.isFunction(prop) ? prop.call(context) : prop;
    }

    return SearchableSelector;
});