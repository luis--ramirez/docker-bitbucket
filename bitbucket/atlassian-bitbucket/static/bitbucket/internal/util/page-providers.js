'use strict';

define('bitbucket/internal/util/page-providers', ['jquery', 'lodash', 'bitbucket/internal/util/ajax', 'exports'], function ($, _, ajax, exports) {

    'use strict';

    function filterPage(page, filter) {
        var values = _.filter(page.values, filter);
        return $.extend(page, {
            values: values,
            size: values.length
        });
    }

    function index(start, values) {
        return _.map(values, function (value, index) {
            return { value: value, index: start + index };
        });
    }

    function deindex(indexedVals) {
        return _.pluck(indexedVals, 'value');
    }

    /**
     * A provider of pages filtered with a predicate
     * @param provider the delegate page provider
     * @param filter the predicate function to filter the pages provided by the underlying provider
     * @constructor
     */
    function FilteredPageProvider(provider, filter) {
        this.provider = provider;
        this.filter = filter;
    }

    /**
     * Fetches a page of results
     * @param start the start index
     * @param limit the limit on the number of elements in the page
     * @returns {Promise}
     */
    FilteredPageProvider.prototype.fetch = function (start, limit) {
        var self = this;
        //fetch twice as many as we need (unfiltered) to minimise round-trips to make up a full filtered page
        var multiplier = 2;

        return this.provider.fetch(start, limit * multiplier).then(function (page) {
            var indexed = index(start, page.values);
            var filtered = _.filter(indexed, function (valIndex) {
                return self.filter(valIndex.value);
            });

            var pageValues = filtered.slice(0, limit);
            var nextPageFirstValue = filtered.slice(limit, limit + 1);

            var result = {
                values: deindex(pageValues),
                size: pageValues.length,
                start: start,
                limit: limit,
                isLastPage: nextPageFirstValue.length === 0 && page.isLastPage
            };
            if (!result.isLastPage) {
                result.nextPageStart = nextPageFirstValue.length ? nextPageFirstValue[0].index : page.nextPageStart;
            }
            return result;
        });
    };

    /**
     * A provider of pages where the entire set of results are already known up-front
     * @param values the entire set of results to be returned as pages
     * @constructor
     */
    function PreloadedPageProvider(values) {
        this.values = values;
    }

    /**
     * Fetches a page of results
     * @param start the start index
     * @param limit the limit on the number of elements in the page
     * @returns {Promise}
     */
    PreloadedPageProvider.prototype.fetch = function (start, limit) {
        var self = this;
        var values = self.values;

        //the page request exceeds the boundaries of the values (or there are no values)
        if (start >= values.length) {
            return $.Deferred().resolve({
                start: start,
                values: [],
                size: 0,
                limit: limit,
                isLastPage: true
            });
        }

        var end = start + limit;
        if (end <= values.length) {
            //the page request falls within the page of results
            var slice = values.slice(start, end);
            var isLastPage = end === values.length;
            return $.Deferred().resolve({
                start: start,
                values: slice,
                size: limit,
                limit: limit,
                isLastPage: isLastPage,
                nextPageStart: isLastPage ? undefined : end
            });
        } else {
            //the page exceeds the page of results but starts within it
            var partial = values.slice(start, end);
            //there are no more results beyond the first page
            return $.Deferred().resolve({
                start: start,
                values: partial,
                size: partial.length,
                limit: limit,
                isLastPage: true
            });
        }
    };

    /**
     * A provider of pages retrieved via an AJAX request
     * @param restBuilder the builder to construct the URL used for the AJAX requests
     * @constructor
     */
    function AjaxPageProvider(restBuilder) {
        this.restBuilder = restBuilder;
    }

    /**
     * Fetches a page of results
     * @param start the start index
     * @param limit the limit on the number of elements in the page
     * @returns {Promise}
     */
    AjaxPageProvider.prototype.fetch = function (start, limit) {
        var url = this.restBuilder.withParams({ start: start, limit: limit }).build();
        return ajax.rest({ url: url, type: 'GET' });
    };

    /**
     * A provider of pages where the start of each page request to an underlying page provider is offset by a constant number
     * @param provider the underlying page provider
     * @param offset the fixed offset >= 0
     * @constructor
     */
    function OffsetPageProvider(provider, offset) {
        this.provider = provider;
        this.offset = offset;
    }

    /**
     * Fetches a page of results
     * @param start the start index
     * @param limit the limit on the number of elements in the page
     * @returns {Promise}
     */
    OffsetPageProvider.prototype.fetch = function (start, limit) {
        var self = this;
        var offset = self.offset;

        return self.provider.fetch(start + offset, limit).then(function (page) {
            page.start = start;
            if (!page.isLastPage) {
                page.nextPageStart = page.nextPageStart - offset;
            }
            return page;
        });
    };

    /**
     * A provider of pages where the entire set of results is composed from the pages of other page providers.
     * Fetch requests are delegated to each underlying page providers in turn moving to the next once the current provider
     * has exhausted its supply of pages.
     *
     * Page requests will only ever return page results from the current page provider. In some cases this will result
     * in empty pages returned or smaller pages than requested returned but with the result clearly indicated (by way
     * of isLastPage and nextPageStart) that subsequent calls are likely to return more result. This is purely to
     * simplify the implementation but *is* compatible with our paged table / scrollable protocol.
     *
     * Note: fetch requests to this page provider must be contiguous or an exception will be thrown.
     *
     * @param providers the {Array} of composite page providers
     * @constructor
     */
    function CompositePageProvider(providers) {
        this.providers = providers;
        this.offset = 0;
        this.nextPageStart = 0;
    }

    /**
     * Fetches a page of results.
     *
     * Note: fetch requests to this page provider must be contiguous or an exception will be thrown.
     *
     * @param start the start index
     * @param limit the limit on the number of elements in the page
     * @returns {Promise}
     */
    CompositePageProvider.prototype.fetch = function (start, limit) {
        var self = this;
        var providers = self.providers;

        if (self.nextPageStart !== start) {
            throw new Error('Page requests must be contiguous (expected start: ' + self.nextPageStart + ', actual start: ' + start + ')');
        }

        if (!providers.length) {
            return $.Deferred().resolve(self._mark({
                start: start,
                limit: limit,
                size: 0,
                values: [],
                isLastPage: true
            }));
        }

        var offset = self.offset;
        var provider = providers[0];
        var hasNextProvider = providers.length > 1;

        return provider.fetch(start - offset, limit).then(function (page) {
            page = $.extend(page, { start: start, limit: limit });
            if (page.isLastPage) {
                if (hasNextProvider) {
                    page = $.extend(page, { isLastPage: false, nextPageStart: offset + start + page.size });
                    providers.shift();
                    self.offset = start + page.size;
                }
            } else {
                page.nextPageStart = page.nextPageStart + offset;
            }
            return self._mark(page);
        });
    };

    CompositePageProvider.prototype._mark = function (page) {
        this.nextPageStart = page.isLastPage ? page.start + page.size : page.nextPageStart;
        return page;
    };

    exports.AjaxPageProvider = AjaxPageProvider;
    exports.CompositePageProvider = CompositePageProvider;
    exports.FilteredPageProvider = FilteredPageProvider;
    exports.OffsetPageProvider = OffsetPageProvider;
    exports.PreloadedPageProvider = PreloadedPageProvider;
    exports.filterPage = filterPage;
});