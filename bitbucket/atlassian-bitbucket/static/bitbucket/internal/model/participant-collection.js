'use strict';

define('bitbucket/internal/model/participant-collection', ['backbone-brace', 'lodash', 'bitbucket/internal/model/participant'], function (Brace, _, Participant) {

    'use strict';

    var approvalOrder = {
        APPROVED: 1,
        NEEDS_WORK: 2,
        UNAPPROVED: 3
    };

    return Brace.Collection.extend({
        model: Participant,
        /* This is also used by SortParticipantsFunction */
        comparator: function comparator(a, b) {
            return approvalOrder[a.getStatus()] - approvalOrder[b.getStatus()] || a.getUser().getDisplayName().localeCompare(b.getUser().getDisplayName());
        },
        findByUser: function findByUser(user) {
            return _.find(this.models, function (participant) {
                return participant.getUser().getName() === user.getName();
            });
        }
    });
});