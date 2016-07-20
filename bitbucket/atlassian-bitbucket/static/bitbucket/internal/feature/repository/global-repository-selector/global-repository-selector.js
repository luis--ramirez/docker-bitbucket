'use strict';

define('bitbucket/internal/feature/repository/global-repository-selector', ['jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/repository/base-repository-selector'], function ($, nav, BaseRepositorySelector) {

    /**
     * A searchable selector for choosing Repositories
     * @extends {SearchableSelector}
     * @return {GlobalRepositorySelector}  The new GlobalRepositorySelector instance
     *
     * @param {HTMLElement|jQuery}  trigger     The trigger (usually a button) to bind opening the selector to.
     * @param {Object}              options     A hash of options, valid options are specified in GlobalRepositorySelector.prototype.defaults
     */
    function GlobalRepositorySelector(trigger, options) {
        return this.init.apply(this, arguments);
    }

    $.extend(GlobalRepositorySelector.prototype, BaseRepositorySelector.prototype);

    GlobalRepositorySelector.constructDataPageFromPreloadArray = BaseRepositorySelector.constructDataPageFromPreloadArray;

    /**
     * Default options.
     * All options can also be specified as functions that return the desired type (except params that expect a function).
     * Full option documentation can be found on SearchableSelector.prototype.defaults
     * @inheritDocs
     *
     * @param repository {Repository} The repository for which to select related repositories.
     */
    GlobalRepositorySelector.prototype.defaults = $.extend(true, {}, BaseRepositorySelector.prototype.defaults, {
        url: nav.rest().allRepos().withParams({
            avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'xsmall' })
        }).build(),
        queryParamsBuilder: function queryParamsBuilder(searchTerm, start, limit) {
            searchTerm = $.trim(searchTerm);
            var params = {
                start: start,
                limit: limit,
                permission: this._getOptionVal('permission')
            };
            var indexOfSeparator = searchTerm.lastIndexOf('/');
            if (indexOfSeparator === -1) {
                params.name = searchTerm;
            } else {
                params.projectname = searchTerm.substr(0, indexOfSeparator);
                params.name = searchTerm.substr(indexOfSeparator + 1);
            }
            return params;
        },
        searchable: true,
        permission: "REPO_READ"
    });

    return GlobalRepositorySelector;
});