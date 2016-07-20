'use strict';

define('bitbucket/internal/model/stash-user', ['bitbucket/internal/model/person'], function (Person) {

    'use strict';

    var StashUser = Person.extend({
        namedAttributes: {
            'active': 'boolean',
            'avatarUrl': 'string',
            'displayName': 'string',
            'id': 'number',
            'isAdmin': 'boolean',
            'link': Object,
            'links': Object,
            'type': 'string',
            'slug': 'string'
        }
    });

    return StashUser;
});