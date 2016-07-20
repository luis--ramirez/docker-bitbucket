'use strict';

define('bitbucket/internal/model/project', ['backbone-brace', 'bitbucket/internal/model/stash-user'], function (Brace, StashUser) {

    'use strict';

    var Project = Brace.Model.extend({
        namedAttributes: {
            'id': 'number',
            'name': 'string',
            'key': 'string',
            'description': 'string',
            'type': 'string',
            'owner': StashUser,
            'avatarUrl': 'string',
            'link': Object,
            'links': Object,
            'public': 'boolean'
        },
        isEqual: function isEqual(project) {
            return !!(project && project instanceof Project && this.id === project.id);
        }
    }, {
        projectType: {
            NORMAL: 'NORMAL',
            PERSONAL: 'PERSONAL'
        }
    });

    return Project;
});