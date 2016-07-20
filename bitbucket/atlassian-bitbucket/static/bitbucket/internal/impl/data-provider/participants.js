'use strict';

define('bitbucket/internal/impl/data-provider/participants', ['bitbucket/util/navbuilder', 'bitbucket/internal/bbui/data-provider/participants', 'bitbucket/internal/model-transformer', 'bitbucket/internal/util/object'], function (nav, ParticipantsDataProviderSPI, transformer, obj) {
    'use strict';

    /**
     * Provides paged user data
     *
     * @param {Object} options
     * @param {string?} options.avatarSize
     * @param {Repository} options.repository
     * @param {*} initialData
     * @constructor
     */

    function ParticipantsDataProvider(options, initialData) {
        ParticipantsDataProviderSPI.apply(this, arguments);
    }
    obj.inherits(ParticipantsDataProvider, ParticipantsDataProviderSPI);

    /**
     * @see bitbucket/internal/spi/data-provider._transform for how this works.
     *
     * Get a NavBuilder for the REST resource URL this should hit (/rest/project<key>/repo/<slug>/participants).
     *
     * @returns {NavBuilder} builder - the {@link NavBuilder} function
     * @protected
     */
    ParticipantsDataProvider.prototype._getBuilder = function () {
        return nav.rest().project(this.options.repository.project).repo(this.options.repository).participants().withParams(getParams(this.options.avatarSize, this.options.filter.term, this.options.filter.role));
    };

    /**
     * @see bitbucket/internal/spi/data-provider._transform for how this works.
     *
     * @param {Object} page - the data returned from the REST resource - in our case this is always a page.
     * @returns {Array<models.user>} an array of users
     * @private
     */
    ParticipantsDataProvider.prototype._transform = function (page) {
        return page.values.map(transformer.user);
    };

    /**
     * returns the params object to grab query string params from
     *
     * @param {string} avatarSize - size of avatar to add to the users - t-shirt sizes.
     * @param {string} term - search word
     * @param {string} role - A pull request role (AUTHOR|REVIEWER|PARTICIPANT)
     * @returns {{avatarSize: *}}
     */
    function getParams(avatarSize, term, role) {
        var params = {
            avatarSize: bitbucket.internal.widget.avatarSizeInPx({
                size: avatarSize || 'small'
            })
        };
        if (role) {
            params.role = role;
        }
        if (term) {
            // not strictly supported by SPI
            params.filter = term;
        }
        return params;
    }

    return ParticipantsDataProvider;
});