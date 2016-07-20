'use strict';

define('bitbucket/internal/impl/data-provider/paged', ['bitbucket/internal/bbui/data-provider/paged', 'bitbucket/internal/util/object'], function (PagedDataProviderSPI, obj) {

    /**
     * @param {Object?} options
     * @param {NavBuilder?} options.builder
     * @param {Object} options.filter
     * @constructor
     */
    function PagedDataProvider(options) {
        options = options || {};
        PagedDataProviderSPI.apply(this, arguments);

        if (options.builder) {
            this._baseBuilder = options.builder;
        }
    }
    obj.inherits(PagedDataProvider, PagedDataProviderSPI);

    /**
     * Get the builder
     *
     * For subclasses that implement a filter, this method should also add the filter params from the provided filter.
     *
     * @param {NavBuilder} builder - the {@link NavBuilder} function
     * @protected
     */
    PagedDataProvider.prototype._getBuilder = function () {
        return this._baseBuilder;
    };

    /**
     * Fetch the next set of data based on the last set. (We use a given dataset to determine the next set to fetch)
     * @param {Object} lastResponseData
     * @returns {Promise}
     * @protected
     */
    PagedDataProvider.prototype._fetchNext = function (lastResponseData) {
        var baseBuilder = this._getBuilder();

        if (!baseBuilder) {
            throw new Error('A base builder must be provided.');
        }

        var builder = baseBuilder.withParams({
            start: lastResponseData ? lastResponseData.nextPageStart : 0
        });

        return this._fetch(builder.build());
    };

    /**
     * Indicator for whether we have reached the last page.
     * @param {Object} lastPageData
     * @returns {boolean}
     * @protected
     */
    PagedDataProvider.prototype._reachedEnd = function (lastResponseData) {
        return lastResponseData && lastResponseData.isLastPage;
    };

    return PagedDataProvider;
});