define('bitbucket/internal/bbui/paged-table/legacy', ['module', 'exports', 'aui', 'jquery', 'lodash', '../javascript-errors/javascript-errors', '../paged-scrollable/paged-scrollable'], function (module, exports, _aui, _jquery, _lodash, _javascriptErrors, _pagedScrollable) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _aui2 = babelHelpers.interopRequireDefault(_aui);

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _javascriptErrors2 = babelHelpers.interopRequireDefault(_javascriptErrors);

    var _pagedScrollable2 = babelHelpers.interopRequireDefault(_pagedScrollable);

    /**
     * @enum {string}
     */
    var FocusDirection = {
        NEXT: 'next',
        PREVIOUS: 'prev'
    };

    var PagedTable = function (_PagedScrollable) {
        babelHelpers.inherits(PagedTable, _PagedScrollable);


        /**
         * An abstract widget used for tables that wish to handle scroll events and load new rows as the user nears the edge of the page.
         *
         * Support is provided for tables that start with some row content already - the initial count of rows is used as the
         * start of the first page of rows to request.
         *
         * It is assumed sub-classes will want to allow navigation of rows and provision is made for this however it is not
         * strictly necessary for sub-classes to implement.
         *
         * To extend PagedTable, you must implement:
         * this.buildUrl(start, limit) : this must build a URL to retrieve the next page of row data
         * this.handleNewRows(data, attachmentMethod) : given a RestPage object and an attachmentMethod ('prepend', 'append', or 'html'),
         * should add new rows to the table
         * this.handleErrors(errors) : should display something appropriate in response to the errors encountered when retrieving new row data
         *
         * You must also supply the following options for which there are no defaults:
         *  - allFetchedMessageHtml - the message shown when all rows have been fetched
         *  - getNoneFoundMessageHtml - function which returns a message to show when there were no rows to display
         *  - tableMessageClass - the custom CSS class for the element used to display table messages
         *
         * You may wish to supply the following options to override defaults:
         *  - ajaxDataType (defaults to 'json') - the data type of the ajax response
         *  - rowSelector (defaults to '> tbody > tr') - allows other elements (such as lists) to be used instead of an actual HTML table
         *
         *  @param {Object} options - optins for this PagedScrollable
         *  @param {HTMLElement|jQuery} options.tableEl - the target `<table>`
         *  @param {boolean} options.filterable - whether the table is filterable
         *  @param {HTMLElement|jQuery?} options.filterEl - the linked filter, if any. If filterable is set and a
         *         filter isn't provided, one will be added to the DOM above the table.
         *  @param {number?} options.filterDebounce - how long to wait before updating the filter
         *  @param {string?} options.scrollPaneSelector - the optional selector to listen for scroll events on
         *  @param {PagedDataProvider} options.dataProvider - the DataProvider for this PagedScrollable
         */

        function PagedTable() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
            babelHelpers.classCallCheck(this, PagedTable);

            var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(PagedTable).call(this, options));

            _this.$table = (0, _jquery2.default)(_this.options.tableEl);

            if (_this.options.filterable) {
                (function () {
                    var tableId = _this.$table.attr('id');
                    if (!tableId) {
                        tableId = _lodash2.default.uniqueId('paged-table-');
                        _this.$table.attr('id', tableId);
                    }

                    if (_this.options.filterEl) {
                        _this.$filter = (0, _jquery2.default)(_this.options.filterEl);
                    } else {
                        _this.$filter = (0, _jquery2.default)(bitbucket.internal.component.pagedTable.filter({
                            forId: tableId,
                            filter: _this.provider.filter
                        }));
                        _this.$filter.insertBefore(_this.$table);
                    }

                    var onFilterChanged = _lodash2.default.debounce(_this._onFilterChanged, _this.options.filterDebounce);
                    _this.$filter.on('keyup.paged-table-filter', function (e) {
                        if (e.which === _aui2.default.keyCode.ESCAPE) {
                            (0, _jquery2.default)(_this).blur();
                        } else {
                            onFilterChanged(e);
                        }
                    }).on('paste.paged-table-filter', onFilterChanged);
                })();
            }

            _this.$spinner = (0, _jquery2.default)(bitbucket.internal.component.pagedTable.spinner()).insertAfter(_this.$table);
            _this.provider.on('data-requested', function () {
                _this.$spinner.removeClass('hidden').spin(_this.options.spinnerSize);
            });

            var delayedHideSpinner = _lodash2.default.debounce(function () {
                _this.$spinner.addClass('hidden').spinStop();
            }, 0);

            _this.provider.on('data-loaded', delayedHideSpinner);
            _this.provider.on('data-request-failed', delayedHideSpinner);
            return _this;
        }

        return PagedTable;
    }(_pagedScrollable2.default);

    /**
     * @type {Object} defaults
     * @property {string} spinnerSize - the size of the spinner
     * @property {boolean} filterable - should the paged table be filterable?
     * @property {number} bufferPixels - the buffer from the bottom/top of the list at which new content gets loaded
     * @property {number} filterDebounce - time in ms for the filter search debounce callback
     * @property {string} rowSelector - the selector that represents a row in the paged table
     * @property {string} rowKeySelector - the key element selector that represents a row (i.e. the rightmost part of rowSelector)
     * @property {Object} focusOptions
     * @property {string} focusOptions.focusedClass - the CSS class to use on the focused row
     * @property {boolean} focusOptions.wrapAround - should the focus wrap around?
     * @property {string} focusOptions.itemLinkSelector - the selector that represents the link to an item in the row
     */
    PagedTable.defaults = {
        spinnerSize: 'large',
        filterable: false,
        bufferPixels: 150,
        filterDebounce: 350,
        rowSelector: '> tbody > tr',
        rowKeySelector: 'tr',
        focusOptions: {
            focusedClass: 'focused',
            wrapAround: false,
            itemLinkSelector: '.title a'
        }
    };

    PagedTable.prototype.init = function () {
        var _this2 = this;

        return _pagedScrollable2.default.prototype.init.apply(this, arguments).done(function () {
            if (_this2.shortcutsInitialised) {
                _this2.focusInitialRow();
            }
        });
    };

    PagedTable.prototype.getFilterText = function () {
        return this.provider.filter.term;
    };

    PagedTable.prototype._onFilterChanged = function () {
        var term = _jquery2.default.trim(this.$filter.val());
        if (term !== this.provider.filter.term) {
            this.provider.setFilter('term', term);
            this.provider.reset();
        }
    };

    PagedTable.prototype.reset = function () {
        _pagedScrollable2.default.prototype.reset.call(this);
        this.$table.addClass('no-rows');
    };

    PagedTable.prototype.update = function (options) {
        this.reset();
        return this.init(options);
    };

    PagedTable.prototype.attachNewContent = function (data) {
        if (data.length) {
            this.handleNewRows(data);
            this._$rows = this.$table.find(this.options.rowSelector);
            if (this.provider.reachedEnd) {
                this.handleLastPage();
            }
            this.$table.removeClass('no-rows');
        } else if (this.provider.reachedEnd) {
            // if the first page has no PRs
            if (this._page === 0) {
                this.handleNoData();
            } else {
                // otherwise must be the last page, so no more pull requests.
                this.handleLastPage();
            }
        }

        // Once we have finished manipulating update the timestamp.
        this.updateTimestamp();
    };

    /**
     * Modify the last updated timestamp. This should be called after any modification to the
     * table is made. This is useful when writing browser tests
     */
    PagedTable.prototype.updateTimestamp = function () {
        this.$table.attr('data-last-updated', new Date().getTime());
    };

    /**
     * Implement if rows can be focused and keyboard shortcuts allow focus navigation
     */
    PagedTable.prototype.focusInitialRow = function () {
        this.$table.find(this.options.rowSelector).first().addClass(this.options.focusOptions.focusedClass);
    };

    /**
     * Override if keyboard shortcuts are required but be sure to call this method afterwards
     * @returns {Object}
     */
    PagedTable.prototype.initShortcuts = function () {
        this.shortcutsInitialised = true;
        this.focusInitialRow(); //initShortcuts is called after init, so we need to manually call this the first time.
        return {
            destroy: this.resetShortcuts.bind(this)
        };
    };

    /**
     *
     * Get the currently focused item in the table.
     * @returns {jQuery}
     * @private
     */
    PagedTable.prototype._getFocusedItem = function () {
        return this.$table.find(this.options.rowSelector + '.' + this.options.focusOptions.focusedClass);
    };

    /**
     * Open the currently focused item using the focusOptions itemLinkSelector
     */
    PagedTable.prototype.openItem = function () {
        var $focusedItem = this._getFocusedItem();
        if ($focusedItem.length) {
            $focusedItem.find(this.options.focusOptions.itemLinkSelector).get(0).click();
        }
    };

    /**
     * Move the focus to the previous or next row and scroll the focused item in to view if needed
     *
     * @param {FocusDirection} direction - the direction to move
     */
    PagedTable.prototype._moveFocus = function (direction) {
        var $focusedItem = this._getFocusedItem();
        var $next = $focusedItem[direction](this.options.rowKeySelector);

        // if we need to wrap around, check if the current item is the first/last item in the list (depending on direction)
        if (this.options.focusOptions.wrapAround) {
            // check if we need to go the first or last item
            if (direction === FocusDirection.NEXT && $focusedItem.is(this._$rows.last())) {
                $next = this._$rows.first();
            }
            if (direction === FocusDirection.PREVIOUS && $focusedItem.is(this._$rows.first())) {
                $next = this._$rows.last();
            }
        }

        if ($focusedItem.length && $next.length) {
            // set focus on the next item and unfocus the previously focused one
            $next.addClass(this.options.focusOptions.focusedClass);
            $focusedItem.removeClass(this.options.focusOptions.focusedClass);

            // Scroll in to view if needed.
            // Check if the $next item is above the upper bound or below the lower bound of
            // the scroll pane's visible area
            var topBound = this.$scrollElement.scrollTop();
            var bottomBound = this.$scrollElement.scrollTop() + this.$scrollElement.height();
            var isOutOfTopBound = $next.offset().top < topBound;
            var isOutOfBottomBound = $next.offset().top + $next.height() > bottomBound;
            if (isOutOfTopBound || isOutOfBottomBound) {
                // align to the bottom when moving up and the top when moving down
                // pass in isOutOfBottomBound as the "alignToTop" boolean because the focused item scrolled in
                // to view should align to the top when the focus has moved passed the bottom of the page
                $next.get(0).scrollIntoView(isOutOfBottomBound);
            }
        }
    };

    /**
     * Move focus to the next row
     */
    PagedTable.prototype.moveNext = function () {
        this._moveFocus(FocusDirection.NEXT);
    };

    /**
     * Move focus to the previous row
     */
    PagedTable.prototype.movePrevious = function () {
        this._moveFocus(FocusDirection.PREVIOUS);
    };

    PagedTable.prototype.resetShortcuts = function () {
        this.shortcutsInitialised = false;
    };

    PagedTable.prototype._new$Message = function (content) {
        if (typeof content === 'function') {
            content = content.call(this);
        }
        if (content) {
            return bitbucket.internal.component.pagedTable.message({
                content: content,
                extraClasses: this.options.tableMessageClass
            });
        }
    };

    PagedTable.prototype.handleLastPage = function () {
        this.$table.after(this._new$Message(this.options.allFetchedMessageHtml));
    };

    PagedTable.prototype.handleNoData = function () {
        this.$table.addClass('no-rows').after(this._new$Message(this.options.getNoneFoundMessageHtml()));
    };

    /**
     * Given an array of Errors, display appropriate error messaging for your implementation.
     * @param {Array<Error>} err - The errors
     * @abstract
     */
    PagedTable.prototype.handleErrors = function (err) {
        // eslint-disable-line no-unused-vars
        throw new _javascriptErrors2.default.NotImplementedError();
    };

    /**
     *
     * @param {Object} data - Data for the new rows
     * @abstract
     */
    PagedTable.prototype.handleNewRows = function (data) {
        // eslint-disable-line no-unused-vars
        throw new _javascriptErrors2.default.NotImplementedError();
    };

    PagedTable.prototype.clear = function () {
        this.$table.children('tbody').empty();
        this.$table.addClass('no-rows').nextAll('.paged-table-message').remove();
    };

    exports.default = PagedTable;
    module.exports = exports['default'];
});