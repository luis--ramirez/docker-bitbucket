'use strict';

define('bitbucket/internal/model/revision', ['backbone-brace', 'bitbucket/internal/model/repository', 'bitbucket/internal/model/revision-reference'], function (Brace, Repository, RevisionReference) {

    'use strict';

    /**
     * Revision is a commit. It should be similar to the server-side
     * "com.atlassian.stash.commit.Commit" class.
     *
     */

    var Revision = Brace.Model.extend({
        namedAttributes: {
            'id': null,
            'displayId': null,
            'repository': Repository,
            'message': null,
            'author': null,
            'authorTimestamp': null,
            'parents': null,
            // attributes has been deprecated for removal in 4.0
            'attributes': null,
            'properties': null
        },
        hasParents: function hasParents() {
            return this.getParents() && this.getParents().length;
        },
        getRevisionReference: function getRevisionReference() {
            return new RevisionReference({
                id: this.getId(),
                displayId: this.getDisplayId(),
                type: RevisionReference.type.COMMIT,
                repository: this.getRepository(),
                latestCommit: this.getId()
            });
        }
    });

    // We have to add the type checking after Revision is already created so we can type-check against the Revision class.
    Brace.Mixins.applyMixin(Revision, {
        namedAttributes: {
            parents: [Revision]
        }
    });

    return Revision;
});