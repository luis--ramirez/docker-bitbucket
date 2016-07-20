'use strict';

define('bitbucket/internal/impl/data-provider/pull-request-list', ['lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/bbui/data-provider/pull-request-list', 'bitbucket/internal/model-transformer', 'bitbucket/internal/util/object'], function (_, nav, PullRequestListDataProviderSPI, transformer, obj) {

    'use strict';

    function PullRequestListDataProvider(options) {
        PullRequestListDataProviderSPI.apply(this, arguments);
    }
    obj.inherits(PullRequestListDataProvider, PullRequestListDataProviderSPI);

    PullRequestListDataProvider.prototype._getBuilder = function () {
        return nav.rest().currentRepo().allPullRequests().withParams({
            avatarSize: bitbucket.internal.widget.avatarSizeInPx({
                size: 'medium'
            }),
            order: 'newest'
        }).withParams(filterParams(this.filter));
    };

    PullRequestListDataProvider.prototype._transform = function (data) {
        var values = data.values || [];
        return values.map(transformer.pullRequest);
    };

    PullRequestListDataProvider.prototype._errorTransform = function (errors) {
        return errors;
    };

    /**
     * Translate the filter values to REST params.
     * Any null values will not be passed along
     *
     * @param {Object} filter - the current filter state
     * @returns {Object}
     */
    function filterParams(filter) {
        var params = {};

        if (filter.target_ref_id) {
            params.at = filter.target_ref_id;
        }

        if (filter.state) {
            params.state = filter.state;
        }

        var participants = [maybeParticipant('AUTHOR', filter.author_id), maybeParticipant('REVIEWER', filter.reviewer_id)].filter(_.identity);

        participants.forEach(function (participant, i) {
            i++;
            params['role.' + i] = participant.role;
            params['username.' + i] = participant.username;
        });

        function maybeParticipant(role, username) {
            if (!username) {
                return null;
            }
            return {
                role: role,
                username: username
            };
        }

        return params;
    }

    return PullRequestListDataProvider;
});