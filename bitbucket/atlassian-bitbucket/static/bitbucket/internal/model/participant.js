'use strict';

define('bitbucket/internal/model/participant', ['backbone-brace', 'bitbucket/internal/model/stash-user'], function (Brace, StashUser) {

    'use strict';

    return Brace.Model.extend({
        namedAttributes: {
            'approved': 'boolean',
            'role': 'string',
            'user': StashUser,
            'status': 'string'
        }
    });
});