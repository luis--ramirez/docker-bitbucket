define('bitbucket/internal/bbui/paged-scrollable/paged-scrollable', ['module', 'exports', 'jquery', 'lodash', 'internal/util/function', 'internal/util/navigator', '../javascript-errors/javascript-errors', '../widget/widget'], function (module, exports, _jquery, _lodash, _function, _navigator, _javascriptErrors, _widget) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _function2 = babelHelpers.interopRequireDefault(_function);

    var _navigator2 = babelHelpers.interopRequireDefault(_navigator);

    var _javascriptErrors2 = babelHelpers.interopRequireDefault(_javascriptErrors);

    var _widget2 = babelHelpers.interopRequireDefault(_widget);

    var isIE = _navigator2.default.isIE();

    /**
     * An abstract widget that will handle scroll events and load new data as the user nears the edge of the page.
     *
     * To extend PagedScrollable, you must implement:
     * this.attachNewContent(data) : given a RestPage object
     * should add new content to the element specified by scrollContentSelector
     *
     * @param {Object} options - see PagedScrollable.defaults.
     * @param {HTMLElement} [options.scrollPaneSelector=window] - the element with overflow: auto | scroll.
     * @param {DataProvider} options.dataProvider - the {PagedDataProvider} feeding this table.
     */
    function PagedScrollable() {
        var _this = this;

        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _widget2.default.call(this, options);

        if (this.options.dataProvider) {
            this.provider = this.options.dataProvider;
        } else {
            throw new Error("PagedScrollable must be given a DataProvider as an option `dataProvider`");
        }

        this.$scrollElement = (0, _jquery2.default)(options.scrollPaneSelector || window);

        if (_jquery2.default.isWindow(this.$scrollElement[0])) {
            (function () {
                // we still want to attach to window.scroll, but documentElement has the properties we need to look at.
                var docEl = window.document.documentElement;
                _this.getPaneHeight = function () {
                    return docEl.clientHeight;
                };
                _this.getContentHeight = function () {
                    return docEl.scrollHeight;
                };
            })();
        }

        this._eventHandlers = [];
        this._page = -1;

        this.provider.on('reset', function () {
            _this._page = -1;
            _this.clear();
            _this.loadIfRequired();
        });
    }
    PagedScrollable.prototype = Object.create(_widget2.default.prototype);
    PagedScrollable.prototype.constructor = PagedScrollable;

    /**
     * PagedScrollable default options
     *
     * @property {number} pageSize - used as the limit parameter to requestData,
     * @property {number} scrollDelay - the number of milliseconds to debounce before handling a scroll event.
     * @property {number} bufferPixels - load more data if the user scrolls within this many pixels of the edge of the loaded data.
     * @property {boolean} suspendOnFailure  - When enabled, the paged-scrollable will enter a suspended mode, as if
     *              PagedScrollable.suspend() was called after a data request fails.
     *              To resume requesting data, call PagedScrollable.resume().
     * @property {boolean} autoLoad  - Whether to automatically load the previous/next page as you scroll to the top/bottom. Either
     *              'previous', 'next', true (for both directions) or false.
     * @property {boolean} preventOverscroll - Whether to prevent scrolling past the beginning or end of a scrollable element
     *               from causing the window to scroll
     * @property {?Function} idForEntity
     */
    PagedScrollable.defaults = {
        pageSize: 50,
        scrollDelay: 250,
        bufferPixels: 0,
        suspendOnFailure: true,
        autoLoad: true,
        preventOverscroll: false,
        idForEntity: null
    };

    /**
     * Load the initial data
     *
     * @param {Object?} [options={}] - Optional options for this PagedScrollable
     * @param {boolean} [options.suspended=false] - if true, the scrollable will start out suspended - it won't load any data.
     * @returns {Promise}
     */
    PagedScrollable.prototype.init = function () {
        var _this2 = this,
            _arguments = arguments;

        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        PagedScrollable.prototype.reset.call(this);

        if (options.suspended) {
            this.suspend();
        }

        return loadInternal.call(this).then(undefined, function () {
            // TODO: base this on the error returned from REST. Only do it if the line is out of range for the file.
            var pageSize = _this2.options.pageSize;
            var startAtItem = options.targetedItem ? Math.floor(options.targetedItem / pageSize) * pageSize : 0;
            var isPastEnd = startAtItem !== 0;

            if (isPastEnd) {
                // fallback to the first page.
                return loadInternal.call(_this2);
            }

            // fail the same way as before.
            return _jquery2.default.Deferred().rejectWith(_this2, _arguments);
        }).fail(function (data) {
            if (data && data.errors && data.errors.length) {
                _this2.handleErrors(data.errors);
            }
            // else assume error was already handled.
        });
    };

    PagedScrollable.prototype.reset = function () {
        if (this.provider.isFetching) {
            this.provider.abort();
        }

        this.clearListeners();

        if (this._resizeHandler) {
            (0, _jquery2.default)(window).off('resize', this._resizeHandler);
            this._resizeHandler = null;
        }

        this.idForEntity = this.idForEntity || this.options.idForEntity;

        if (typeof this.idForEntity === 'function') {
            this._ids = {};
        }

        // must happen after this.provider.abort() to avoid the scrollable becoming suspended on a reinit.
        this._suspended = false;
        this._page = -1;

        this.clear();
    };

    PagedScrollable.prototype.destroy = function () {
        this.reset();
        delete this.$scrollElement;
    };

    /**
     * Stop requesting new data.  Any requests already in the pipeline will complete.
     * To resume requesting data, call PagedScrollable.resume();
     */
    PagedScrollable.prototype.suspend = function () {
        this._suspended = true;
    };

    /**
     * Resume requesting new data.
     *
     * @returns {Promise|undefined}
     */
    PagedScrollable.prototype.resume = function () {
        this._suspended = false;

        // if they are near the top/bottom of the page, request the data they need immediately.
        return this.loadIfRequired();
    };

    /**
     * @returns {boolean}
     */
    PagedScrollable.prototype.isSuspended = function () {
        return this._suspended;
    };

    /**
     * @returns {Number} the scroll top of the scrollable element
     */
    PagedScrollable.prototype.getScrollTop = function () {
        return this.$scrollElement.scrollTop();
    };

    /**
     * Set the scroll top of the scrollable element
     *
     * @param {Number} scrollTop the scroll to to set
     */
    PagedScrollable.prototype.setScrollTop = function (scrollTop) {
        this.$scrollElement.scrollTop(scrollTop);
    };

    /**
     * @returns {jQuery} a jQuery object for the scrollable element
     */
    PagedScrollable.prototype.getPane = function () {
        return this.$scrollElement;
    };

    /**
     * @returns {Number} the visible height of the scrollable element
     */
    PagedScrollable.prototype.getPaneHeight = function () {
        return this.$scrollElement[0].clientHeight;
    };

    /**
     * @returns {Number} the actual height of the scrollable element
     */
    PagedScrollable.prototype.getContentHeight = function () {
        return this.$scrollElement[0].scrollHeight;
    };

    /**
     * @param {String} opt the option to return
     * @returns {*} the value of the object
     */
    PagedScrollable.prototype.getOption = function (opt) {
        if (Object.prototype.hasOwnProperty.call(this.options, opt)) {
            return this.options[opt];
        }
        return undefined;
    };

    /**
     * Override the existing options
     *
     * @param {Object} opts the options to override
     */
    PagedScrollable.prototype.setOptions = function (opts) {
        if (_jquery2.default.isPlainObject(opts)) {
            this.options = _jquery2.default.extend(this.options, opts);
        }
    };

    /**
     * Bind a scroll listener to the paged scrollable
     *
     * @param {Function} func - the scroll listener
     */
    PagedScrollable.prototype.addScrollListener = function (func) {
        var handler = this.scrollDelay ? _lodash2.default.debounce(func, this.scrollDelay) : func;
        this._eventHandlers.push(handler);
        this.$scrollElement.on('scroll.paged-scrollable', handler);
    };

    PagedScrollable.prototype._bindOverscrollPrevention = function () {

        /**
         * @param {Event} e - the scroll event
         * @param {number} delta - the threshold for overscroll protection
         * @this HTMLElement
         */
        function overscrollPrevention(e, delta) {
            var height = (0, _jquery2.default)(this).outerHeight();
            var scrollHeight = this.scrollHeight;

            if (this.scrollTop === scrollHeight - height && delta < 0 || this.scrollTop === 0 && delta > 0) {
                //If at the bottom scrolling down, or at the top scrolling up
                e.preventDefault();
            }
        }

        this._eventHandlers.push(overscrollPrevention);
        this.$scrollElement.on('mousewheel.paged-scrollable', overscrollPrevention);
    };

    /**
     * Unbind all listeners
     */
    PagedScrollable.prototype.clearListeners = function () {
        var _this3 = this;

        _lodash2.default.each(this._eventHandlers, function (handler) {
            _this3.$scrollElement.unbind('.paged-scrollable', handler);
        });
        this._eventHandlers.length = 0;
    };

    /**
     * Perform a load if required. Will check the state and current position of the scroll pane
     *
     * @returns {Promise|undefined}
     */
    PagedScrollable.prototype.loadIfRequired = function () {
        if (this.isSuspended() || this.provider.reachedEnd) {
            return;
        }

        var scrollTop = this.getScrollTop();
        var scrollPaneHeight = this.getPaneHeight();
        var contentHeight = this.getContentHeight();
        var scrollBottom = scrollPaneHeight + scrollTop;

        if (!_jquery2.default.isWindow(this.getPane()[0]) && this.getPane().is(":hidden")) {
            return;
        }

        //// paging previous might not work if page is filtered and deeplinked
        //if (_.any([true, 'previous'], fn.eq(this.options.autoLoad)) &&
        //    scrollTop < this.options.bufferPixels + (this.loadedRange.start / this.loadedRange.nextPageStart) * contentHeight) {
        //
        //    const pageBefore =  this.loadedRange.pageBefore(this.options.pageSize);
        //    if (pageBefore) {
        //        return this.load(pageBefore.start, pageBefore.limit);
        //    }
        //}
        //

        // In Chrome on Windows at some font sizes (Ctrl +), the scrollPaneHeight is rounded down, but contentHeight is
        // rounded up (I think). This means there is a 1px difference between them and the event won't fire.
        var chromeWindowsFontChangeBuffer = 1;
        //
        if (_lodash2.default.any([true, 'next'], _function2.default.eq(this.options.autoLoad)) && scrollBottom + chromeWindowsFontChangeBuffer >= contentHeight - this.options.bufferPixels) {
            return this.load();
        }
    };

    /**
     * Fetch the data from the data provider.
     *
     * @this PagedScrollable
     * @fires PagedScrollable#pagination
     * @returns {Promise}
     */
    function loadInternal() {
        var _this4 = this;

        if (this.provider.isFetching) {
            return _jquery2.default.Deferred().reject();
        }

        return this.provider.fetchNext().done(this.onDataLoaded).fail(function () {
            if (_this4.options.suspendOnFailure) {
                _this4.suspend();
            }
        });
    }

    /**
     * @returns {Promise}
     */
    PagedScrollable.prototype.load = function () {
        var _this5 = this;

        return loadInternal.call(this).fail(function (data) {
            if (data && data.errors) {
                _this5.handleErrors(data.errors);
            }
        });
    };

    /**
     * @fires PagedScrollable#data-loaded
     * @param {Object} data - The data that was loaded
     */
    PagedScrollable.prototype.onDataLoaded = function (data) {
        this._page++;
        // only trigger pagination UI events when we aren't going
        // to the initial page
        if (this._page > 0) {
            this.trigger('pagination', {
                // paging should be 1-indexed
                page: this._page + 1
            });
        }

        var oldScrollTop = void 0;
        if (isIE) {
            // values for calculating offset
            oldScrollTop = this.getScrollTop();
        }

        data = this._addPage(data);

        // scroll to where the user was before we added new data.  IE reverts to the initial position (top or line
        // specified in hash) when you append content, so we need to always rescroll in IE.
        if (isIE) {
            this.setScrollTop(oldScrollTop);
        }

        if (this._page === 0) {
            this.onFirstDataLoaded(data);
        }

        //retrigger scroll - load more if we're still at the edges.
        this.loadIfRequired();
    };

    /**
     * Filters duplicates and adds the page to the table.
     *
     * @param {Object} data the original page data
     * @returns {Object} the filtered page data added to the table
     * @private
     */
    PagedScrollable.prototype._addPage = function (data) {
        data = this._dedupe(data);
        this.attachNewContent(data);
        this.trigger('page-rendered');
        return data;
    };

    /**
     * Remove any duplicate entities which have already appeared in the PagedScrollable
     *
     * @param {Array|{values: Array}} data - the original data which will not be modified
     * @returns {Array|Object} the data modified
     * @private
     */
    PagedScrollable.prototype._dedupe = function (data) {
        var _this6 = this;

        // Only dedupe data when a idForEntity is provided and
        // the data is a page
        if (data && (Array.isArray(data) && data.length > 0 || Array.isArray(data.values)) && typeof this.idForEntity === 'function') {
            var _ret2 = function () {
                var ids = _this6._ids;
                var filterFn = function filterFn(entity) {
                    var id = _this6.idForEntity(entity);
                    if (!_lodash2.default.has(ids, id)) {
                        ids[id] = true;
                        return true;
                    }
                    return false;
                };

                if (Array.isArray(data)) {
                    return {
                        v: data.filter(filterFn)
                    };
                } else if (Array.isArray(data.values)) {
                    data = _jquery2.default.extend({}, data, {
                        values: data.values.filter(filterFn)
                    });
                    return {
                        v: data
                    };
                }
            }();

            if ((typeof _ret2 === 'undefined' ? 'undefined' : babelHelpers.typeof(_ret2)) === "object") return _ret2.v;
        } else {
            return data;
        }
    };

    PagedScrollable.prototype.onFirstDataLoaded = function () {
        var _this7 = this;

        this.addScrollListener(function () {
            _this7.loadIfRequired();
        });

        if (this.options.preventOverscroll) {
            this._bindOverscrollPrevention();
        }

        (0, _jquery2.default)(window).on('resize', this._resizeHandler = function () {
            _this7.loadIfRequired();
        });
    };

    /**
     * @param {Array<Object>} entities - The page of entities to be added
     * @returns {boolean}
     */
    PagedScrollable.prototype.add = function (entities) {
        if (entities.length) {
            entities = this._addPage(entities);
            return true;
        }
        return false;
    };

    /**
     * @param {Object} entity - The entity to be removed
     * @returns {boolean}
     */
    PagedScrollable.prototype.remove = function (entity) {
        if (this.options.idForEntity) {
            var id = this.options.idForEntity(entity);
            if (_lodash2.default.has(this._ids, id)) {
                delete this._ids[id];
                return true;
            }
        }
        return false;
    };

    PagedScrollable.prototype.attachNewContent = function (data) {
        // eslint-disable-line no-unused-vars
        throw new _javascriptErrors2.default.NotImplementedError('attachNewContent is abstract and must be implemented.');
    };

    PagedScrollable.prototype.handleErrors = function (err) {
        // eslint-disable-line no-unused-vars
        throw new _javascriptErrors2.default.NotImplementedError('handleErrors is abstract and must be implemented.');
    };

    /**
     * Clear should remove items from the DOM to make way for new things.
     */
    PagedScrollable.prototype.clear = function () {
        throw new _javascriptErrors2.default.NotImplementedError('clear is abstract and must be implemented.');
    };

    /**
     * Pagination event.
     *
     * @event PagedScrollable#pagination
     * @type {Object}
     * @property {string} context - Pagination context string. To differentiate between paging events
     *                              from various sources in the application.
     * @property {number} page - The page we paginated to
     */

    /**
     * Data Loaded event
     * @event PagedScrollable#data-loaded
     * @type {Object} - the data that was just loaded
     */

    exports.default = PagedScrollable;
    module.exports = exports['default'];
});