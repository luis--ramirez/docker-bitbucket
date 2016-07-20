'use strict';

define('bitbucket/internal/widget/paged-scrollable', ['aui', 'jquery', 'lodash', 'bitbucket/internal/util/events', 'bitbucket/internal/util/function', 'bitbucket/internal/util/navigator', 'bitbucket/internal/widget/loaded-range'], function (AJS, $, _, events, fn, navigatorUtil, LoadedRange) {

    'use strict';

    var isIE = navigatorUtil.isIE();

    /**
     * An abstract widget that will handle scroll events and load new data as the user nears the edge of the page.
     *
     * To extend PagedScrollable, you must implement:
     * this.requestData(start, limit) : must return a promise with a RestPage object as the first done() argument.
     * this.attachNewContent(data, attachmentMethod) : given a RestPage object and an attachmentMethod ('prepend', 'append', or 'html'),
     * should add new content to the element specified by scrollContentSelector
     *
     * @param scrollPaneSelector - the element with overflow: auto | scroll
     * @param options see PagedScrollable.defaults.
     */
    function PagedScrollable(scrollPaneSelector, options) {

        this.options = $.extend({}, PagedScrollable.defaults, options);

        this.$scrollElement = $(scrollPaneSelector || window);

        if ($.isWindow(this.$scrollElement[0])) {
            // we still want to attach to window.scroll, but documentElement has the properties we need to look at.
            var docEl = window.document.documentElement;
            this.getPaneHeight = function () {
                return docEl.clientHeight;
            };
            this.getContentHeight = function () {
                return docEl.scrollHeight;
            };
        }

        this._eventHandlers = [];
    }
    /**
     * PagedScrollable default options
     *
     * @property {number} pageSize - used as the limit parameter to requestData,
     * @property {number} scrollDelay - the number of milliseconds to debounce before handling a scroll event.
     * @property {number} bufferPixels - load more data if the user scrolls within this many pixels of the edge of the loaded data.
     * @property {boolean} precedingSpaceMaintained - Set this to true if your implementation will add blank space above the loaded content as a placeholder for content
     *              that will be loaded as the user scrolls up.  Setting this to true means PagedScrollable will load a previous page when
     *              the proportion of the content scrolled is less than the start of your loaded range (i.e., wandering into the 'placeholder' territory you've created.
     *              <code>scrollElement.scrollTop < bufferPixels + (loadedRange.start / loadedRange.nextPageStart) * scrollContent.height</code>
     *              Setting it false means a previous page will be loaded when
     *              <code>scrollElement.scrollTop < bufferPixels</code>
     * @property {boolean} suspendOnFailure  - When enabled, the paged-scrollable will enter a suspended mode, as if PagedScrollable.suspend() was called after a data request fails.
     *              To resume requesting data, call PagedScrollable.resume().
     * @property {string} dataLoadedEvent  - name of the events event that will be fired when data is loaded
     * @property {boolean} autoLoad  - Whether to automatically load the previous/next page as you scroll to the top/bottom. Either 'previous', 'next', true (for both directions) or false.
     * @property {boolean} preventOverscroll - Whether to prevent scrolling past the beginning or end of a scrollable element from causing the window to scroll
     * @property {?Function} idForEntity
     * @property {?string} paginationContext - Will be passed as the "context" for the pagination ui event
     */
    PagedScrollable.defaults = {
        pageSize: 50,
        scrollDelay: 250,
        bufferPixels: 0,
        precedingSpaceMaintained: true,
        suspendOnFailure: true,
        dataLoadedEvent: 'bitbucket.internal.widget.pagedscrollable.dataLoaded',
        autoLoad: true,
        preventOverscroll: false,
        idForEntity: null,
        paginationContext: null
    };

    //load the initial data
    PagedScrollable.prototype.init = function (options) {
        PagedScrollable.prototype.reset.call(this);

        options = options || {};

        this.loadedRange = options.loadedRange || new LoadedRange();
        var self = this;
        var pageSize = this.options.pageSize;
        var startAtItem = options.targetedItem ? Math.floor(options.targetedItem / pageSize) * pageSize : 0;

        if (options.suspended) {
            this.suspend();
        }

        // if the start item is already loaded we probably don't have to load any more.
        if (this.loadedRange.isLoaded(startAtItem)) {

            // but it's possible the window is larger than the page size, so trigger a fake scroll anyway just to see if that causes any new loads.
            return (this.loadIfRequired() || $.Deferred().resolve()).done(function () {
                // do our onFirstDataLoaded call now if we can, or after whatever loads next.
                self.onFirstDataLoaded();
            });
        }

        return loadInternal(this, startAtItem, pageSize).then(undefined, function () {
            // TODO: base this on the error returned from REST. Only do it if the line is out of range for the file.
            var isPastEnd = startAtItem !== 0;

            if (isPastEnd) {
                // fallback to the first page.
                return loadInternal(self, 0, pageSize);
            } else {
                // fail the same way as before.
                return $.Deferred().rejectWith(this, arguments);
            }
        }).fail(function (xhr, text, error, data) {
            if (data && data.errors && data.errors.length) {
                self.handleErrors(data.errors);
            }
            // else assume error was already handled.
        });
    };

    PagedScrollable.prototype.reset = function () {
        if (this.currentXHR) {
            this.cancelRequest();
        }

        this.clearListeners();

        if (this._resizeHandler) {
            $(window).off('resize', this._resizeHandler);
            this._resizeHandler = null;
        }

        if (this.options.idForEntity) {
            this._ids = {};
        }

        // must happen after this.cancelRequest() to avoid the scrollable becoming suspended on a reinit.
        this._suspended = false;
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
     */
    PagedScrollable.prototype.resume = function () {
        this._suspended = false;

        // if they are near the top/bottom of the page, request the data they need immediately.
        return this.loadIfRequired();
    };

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
        if ($.isPlainObject(opts)) {
            this.options = $.extend(this.options, opts);
        }
    };

    /**
     * Bind a scroll listener to the paged scrollable
     *
     * @param {Function} func the scroll listener
     */
    PagedScrollable.prototype.addScrollListener = function (func) {
        var handler = this.scrollDelay ? _.debounce(func, this.scrollDelay) : func;
        this._eventHandlers.push(handler);
        this.$scrollElement.on('scroll.paged-scrollable', handler);
    };

    PagedScrollable.prototype._bindOverscrollPrevention = function () {
        function overscrollPrevention(e, delta) {
            // If you are zoomed, then the scroll position will never exactly match the right scroll height - it'll be some fraction smaller.
            // We consider anything within (exclusive) 1px of the edge to be the edge.
            var buffer = 1;
            var scrollTopAtTop = buffer;
            var scrollTopAtBottom = this.scrollHeight - $(this).outerHeight() - buffer;

            // In some cases, the momentum scrolling ends up as NaN after jquery.mousewheel gets to it (division by zero).
            // I don't think those events actually let overscrolls occur (at least I found it hard to reproduce), but
            // since they _should_ have no effect, we consider those to be movement in the bad direction anyway.
            var movingDown = delta < 0 || isNaN(delta);
            var movingUp = delta > 0 || isNaN(delta);

            var shouldPrevent = this.scrollTop > scrollTopAtBottom && movingDown || this.scrollTop < scrollTopAtTop && movingUp;
            if (shouldPrevent) {
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
        var self = this;
        _.each(this._eventHandlers, function (handler) {
            self.$scrollElement.unbind('.paged-scrollable', handler);
        });
        this._eventHandlers.length = 0;
    };

    PagedScrollable.prototype.loadIfRequired = function () {
        if (this.isSuspended() || this.loadedRange.reachedEnd() && this.loadedRange.reachedStart()) {
            return;
        }

        var scrollTop = this.getScrollTop();
        var scrollPaneHeight = this.getPaneHeight();
        var contentHeight = this.getContentHeight();
        var scrollBottom = scrollPaneHeight + scrollTop;

        if (!$.isWindow(this.getPane()[0]) && this.getPane().is(":hidden")) {
            return;
        }

        // paging previous might not work if page is filtered and deeplinked
        if (_.any([true, 'previous'], fn.eq(this.options.autoLoad)) && scrollTop < this.options.bufferPixels + this.loadedRange.start / this.loadedRange.nextPageStart * contentHeight) {

            var pageBefore = this.loadedRange.pageBefore(this.options.pageSize);
            if (pageBefore) {
                return this.load(pageBefore.start, pageBefore.limit);
            }
        }

        // In Chrome on Windows at some font sizes (Ctrl +), the scrollPaneHeight is rounded down, but contentHeight is
        // rounded up (I think). This means there is a 1px difference between them and the event won't fire.
        var chromeWindowsFontChangeBuffer = 1;

        if (_.any([true, 'next'], fn.eq(this.options.autoLoad)) && scrollBottom + chromeWindowsFontChangeBuffer >= contentHeight - this.options.bufferPixels) {
            var pageAfter = this.loadedRange.pageAfter(this.options.pageSize);
            if (pageAfter) {
                return this.load(pageAfter.start, pageAfter.limit);
            }
        }
    };

    function loadInternal(self, start, limit) {
        if (self.currentXHR) {
            return $.Deferred().reject();
        }

        self.currentXHR = self.requestData(start, limit);

        return self.currentXHR.always(function () {
            self.currentXHR = null;
        }).done(function (data) {
            // only trigger pagination UI events when we aren't going
            // to the initial page and if we have a context to provide
            if (!self.loadedRange.isEmpty() && self.options.paginationContext) {
                events.trigger('bitbucket.internal.ui.nav.pagination', null, {
                    context: self.options.paginationContext,
                    // paging should be 1-indexed
                    // N.B. not all data requests provide full paging information, in this case, use the
                    // passed start and limit information.
                    page: (data.start || start) / (data.limit || limit) + 1
                });
            }

            self.onDataLoaded(start, limit, data);
        }).fail(function () {
            self.suspend();
        });
    }

    PagedScrollable.prototype.load = function (start, limit) {
        var self = this;
        return loadInternal(this, start, limit).fail(function (xhr, text, error, data) {
            if (data && data.errors) {
                self.handleErrors(data.errors);
            }
        });
    };
    PagedScrollable.prototype.loadAfter = function () {
        var pageAfter = this.loadedRange.pageAfter(this.options.pageSize);
        return pageAfter && this.load(pageAfter.start, pageAfter.limit);
    };
    PagedScrollable.prototype.loadBefore = function () {
        var pageBefore = this.loadedRange.pageBefore(this.options.pageSize);
        return pageBefore && this.load(pageBefore.start, pageBefore.limit);
    };

    PagedScrollable.prototype.onDataLoaded = function (start, limit, data) {
        if (data.start !== undefined) {
            start = data.start;
        }
        var firstLoad = this.loadedRange.isEmpty();
        var attachmentMethod = this.loadedRange.getAttachmentMethod(start, data.size);
        var isPrepend = attachmentMethod === 'prepend';

        this.loadedRange.add(start, data.size, data.isLastPage, data.nextPageStart);

        var oldHeight;
        var oldScrollTop;
        if (isPrepend || isIE) {
            // values for calculating offset
            oldScrollTop = this.getScrollTop();
            oldHeight = this.getContentHeight();
        }

        data = this._addPage(data, attachmentMethod);

        // scroll to where the user was before we added new data.  IE reverts to the initial position (top or line
        // specified in hash) when you append content, so we need to always rescroll in IE.
        if (isPrepend || isIE) {
            var heightAddedAbove = isPrepend ? this.getContentHeight() - oldHeight : 0;
            this.setScrollTop(oldScrollTop + heightAddedAbove);
        }

        if (firstLoad) {
            this.onFirstDataLoaded(start, limit, data);
        }

        events.trigger(this.options.dataLoadedEvent, this, start, limit, data);

        //retrigger scroll - load more if we're still at the edges.
        this.loadIfRequired();
    };

    /**
     * Filters duplicates and adds the page to the table.
     *
     * @param {Object} data the original page data
     * @param attachmentMethod: <code>prepend</code>, <code>append</code> or <code>html</code>
     * @returns {Object} data the filtered page data added to the table
     * @private
     */
    PagedScrollable.prototype._addPage = function (data, attachmentMethod) {
        data = this._dedupe(data);
        this.attachNewContent(data, attachmentMethod);
        return data;
    };

    /**
     * Remove any duplicate entities which have already appeared in the PagedScrollable
     *
     * @param {Object} data the original data which will not be modified
     * @returns {Object} the data modified
     * @private
     */
    PagedScrollable.prototype._dedupe = function (data) {
        // Only dedupe data when a idForEntity is provided and
        // the data is a page

        if (data && data.values && this.options.idForEntity) {
            var ids = this._ids;
            var idForEntity = this.options.idForEntity;

            data = $.extend({}, data, {
                values: _.filter(data.values, function (entity) {
                    var id = idForEntity(entity);
                    if (!_.has(ids, id)) {
                        ids[id] = true;
                        return true;
                    }
                    return false;
                })
            });
        }

        return data;
    };

    PagedScrollable.prototype.onFirstDataLoaded = function () {
        var self = this;
        this.addScrollListener(function () {
            self.loadIfRequired();
        });

        if (this.options.preventOverscroll) {
            this._bindOverscrollPrevention();
        }

        $(window).on('resize', this._resizeHandler = function () {
            self.loadIfRequired();
        });
    };

    PagedScrollable.prototype.cancelRequest = function () {
        if (this.currentXHR) {
            if (this.currentXHR.abort) {
                this.currentXHR.abort();
            } else if (this.currentXHR.reject) {
                this.currentXHR.reject();
            } else {
                AJS.log("Couldn't cancel the current request.");
            }

            this.currentXHR = null;
        }
    };

    PagedScrollable.prototype.add = function (entities, attachmentMethod) {
        if (entities.length) {
            entities = this._addPage({
                values: entities,
                size: entities.length
            }, attachmentMethod || 'prepend');
            return true;
        }
        return false;
    };

    PagedScrollable.prototype.remove = function (entity) {
        // We only adjust the loadedRange if an idForEntity function
        // is provided. Otherwise there is the chance that by decrementing
        // nextPageStart duplicates will appear in the list
        if (this.options.idForEntity) {
            var id = this.options.idForEntity(entity);
            if (_.has(this._ids, id)) {
                delete this._ids[id];
                if (typeof this.loadedRange.nextPageStart === 'number') {
                    this.loadedRange.nextPageStart = Math.max(0, this.loadedRange.nextPageStart - 1);
                }
                return true;
            }
        }
        return false;
    };

    PagedScrollable.prototype.attachNewContent = function (data, attachmentMethod) {
        throw new Error('attachNewContent is abstract and must be implemented.');
    };

    PagedScrollable.prototype.requestData = function (start, limit) {
        throw new Error('requestData is abstract and must be implemented.  It must return a promise. It is preferred to return a jqXHR.');
    };

    PagedScrollable.prototype.handleErrors = function (errors) {
        throw new Error('handleErrors is abstract and must be implemented.');
    };

    return PagedScrollable;
});