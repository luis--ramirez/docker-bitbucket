'use strict';

define('bitbucket/internal/impl/data-provider/user', ['lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/bbui/data-provider/user', 'bitbucket/internal/model-transformer', 'bitbucket/internal/util/object'], function (_, nav, UserDataProviderSPI, transformer, obj) {
    'use strict';

    /**
     * Provides paged user data
     *
     * @param {Object} options
     * @param {string?} options.avatarSize
     * @param {Array<{name:string, project_id:string?, project_key:string?, repository_slug:string?, repository_id:string?}>?} options.filter.permissions
     * @param {*} initialData
     * @constructor
     */

    function UserDataProvider(options, initialData) {
        UserDataProviderSPI.apply(this, arguments);
    }
    obj.inherits(UserDataProvider, UserDataProviderSPI);

    /**
     * @see bitbucket/internal/spi/data-provider._transform for how this works.
     *
     * Get a NavBuilder for the REST resource URL this should hit (/rest/users).
     *
     * @returns {NavBuilder} builder - the {@link NavBuilder} function
     * @protected
     */
    UserDataProvider.prototype._getBuilder = function () {
        return nav.rest().users().withParams(getParams(this.options.avatarSize, this.options.filter.permissions, this.options.filter.term));
    };

    /**
     * @see bitbucket/internal/spi/data-provider._transform for how this works.
     *
     * @param {Object} page - the data returned from the REST resource - in our case this is always a page.
     * @returns {Array<models.user>} an array of users
     * @private
     */
    UserDataProvider.prototype._transform = function (page) {
        return page.values.map(transformer.user);
    };

    var permissionMap = {
        KNOWN_USER: 'LICENSED_USER'
    };

    /**
     * returns the params object to grab query string params from
     *
     * The REST resource expects permissions to be sent in like:
     *
     * ```
     * permission=REPO_READ&permission.repositorySlug=REPO&permission.projectKey=PROJ
     * ```
     *
     * If you have multiple permissions, each one after the first has its related params suffixed with a '.{n}' where n
     * is a number starting from 1, E.g.:
     *
     * ```
     * permission=REPO_READ&permission.repositorySlug=REPO&permission.projectKey=PROJ
     * &permission.1=PROJ_WRITE&permission.1.projectKey=PROJ2
     * ```
     *
     * @param {string} avatarSize - size of avatar to add to the users - t-shirt sizes.
     * @param {Array<permission>} permissions - permissions the user must have
     * @param {string} term - search word
     * @returns {{avatarSize: *}}
     */
    function getParams(avatarSize, permissions, term) {
        var params = {
            avatarSize: bitbucket.internal.widget.avatarSizeInPx({
                size: avatarSize || 'small'
            })
        };
        if (term) {
            // not strictly supported by SPI
            params.filter = term;
        }
        if (permissions) {
            permissions.forEach(function (permission, i) {
                var baseKey = 'permission' + (i ? '.' + i : '');
                Object.keys(permission).forEach(function (prop) {
                    if (prop === 'name') {
                        params[baseKey] = permissionMap[permission.name] || permission.name;
                    } else {
                        var key = _.camelCase(prop);
                        params[baseKey + '.' + key] = _.endsWith(key, 'id') ? Number(permission[prop]) : permission[prop];
                    }
                });
            });
        }
        return params;
    }

    return UserDataProvider;
});