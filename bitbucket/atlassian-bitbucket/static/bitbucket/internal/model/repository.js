'use strict';

define('bitbucket/internal/model/repository', ['backbone-brace', 'bitbucket/internal/model/project'], function (Brace, Project) {

    'use strict';

    var Repository = Brace.Model.extend({
        namedAttributes: {
            'id': 'number',
            'name': 'string',
            'slug': 'string',
            'project': Project,
            'public': 'boolean',
            'scmId': 'string',
            'state': 'string',
            'statusMessage': 'string',
            'forkable': 'boolean',
            'cloneUrl': 'string',
            'link': Object,
            'links': Object,
            'origin': null
        },
        isEqual: function isEqual(repo) {
            //TODO: Needs test
            return !!(repo && repo instanceof Repository && this.id === repo.id);
        }
    });

    // Need a reference to Repository so must add type checks for origin after creation.
    Brace.Mixins.applyMixin(Repository, {
        namedAttributes: {
            origin: Repository
        }
    });

    return Repository;
});