'use strict';

define('bitbucket/internal/impl/data-provider/ref', ['bitbucket/util/navbuilder', 'bitbucket/internal/bbui/data-provider/ref', 'bitbucket/internal/model-transformer', 'bitbucket/internal/util/object'], function (nav, RefDataProviderSPI, transformer, obj) {

    /**
     * @param {Object?} options
     * @constructor
     */
    function RefDataProvider(options) {
        RefDataProviderSPI.apply(this, arguments);
    }
    obj.inherits(RefDataProvider, RefDataProviderSPI);

    /**
     * Get a NavBuilder for the REST resource URL this should hit(/rest/projectsPROJ/repos/REPO/{tags|branches|commits}}.
     *
     * @returns {NavBuilder} builder - the {@link NavBuilder} function
     * @protected
     */
    RefDataProvider.prototype._getBuilder = function () {
        var refTypes = {
            tag: 'tags',
            branch: 'branches',
            commit: 'commits'
        }[this.filter.type];
        var repo = this.filter.repository;
        var key = repo.project.key;
        var slug = repo.slug;
        return nav.rest().project(key).repo(slug)[refTypes]().withParams({
            filterText: this.filter.term
        });
    };

    /**
     * @see bitbucket/internal/spi/data-provider._transform for how this works.
     *
     * Our Refs don't have type or repository properties, apparently. So we use the
     * filter to populate them on the outgoing models.
     *
     * @param page - data returned from REST
     * @returns {Array<models.ref>} an array of refs
     * @private
     */
    RefDataProvider.prototype._transform = function (page) {
        var type = this.filter.type;
        var repo = this.filter.repository;
        return page.values.map(function (ref) {
            return transformer.ref(ref, type, repo);
        });
    };

    return RefDataProvider;
});