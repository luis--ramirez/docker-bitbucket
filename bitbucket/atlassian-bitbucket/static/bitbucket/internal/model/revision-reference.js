'use strict';

define('bitbucket/internal/model/revision-reference', ['aui', 'backbone-brace', 'lodash', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/repository'], function (AJS, Brace, _, pageState, Repository) {

    'use strict';

    var Type = {
        TAG: {
            id: "tag",
            name: AJS.I18n.getText('bitbucket.web.revisionref.tag.name')
        },
        BRANCH: {
            id: "branch",
            name: AJS.I18n.getText('bitbucket.web.revisionref.branch.name')
        },
        COMMIT: {
            id: "commit",
            name: AJS.I18n.getText('bitbucket.web.revisionref.commit.name')
        },
        isTag: function isTag(o) {
            return o && (o === Type.TAG.id || o.id === Type.TAG.id || o === 'TAG');
        },
        isBranch: function isBranch(o) {
            return o && (o === Type.BRANCH.id || o.id === Type.BRANCH.id || o === 'BRANCH');
        },
        isCommit: function isCommit(o) {
            return o && (o === Type.COMMIT.id || o.id === Type.COMMIT.id);
        },
        from: function from(o) {
            if (Type.isTag(o)) {
                return Type.TAG;
            } else if (Type.isBranch(o)) {
                return Type.BRANCH;
            } else if (Type.isCommit(o)) {
                return Type.COMMIT;
            }
            window.console && console.error("Unknown RevisionReference type " + o);
            return null;
        }
    };

    /**
     * RevisionReference is a "reference" to a commit. This could be a branch, or a tag, or a direct
     * commit hash. It should be similar to the server-side "com.atlassian.stash.repository.Ref" class.
     *
     */
    var RevisionReference = Brace.Model.extend({
        namedAttributes: {
            'id': 'string',
            'displayId': 'string',
            'type': Type.from,
            'isDefault': 'boolean',
            'latestCommit': 'string',
            'hash': 'string', //Tags can also have a hash property; when they aren't simply pointers to a commit, this points to the rich tag object
            'repository': Repository
        },
        initialize: function initialize() {
            if (!this.getDisplayId()) {
                this.setDisplayId(this.getId());
            }
            if (!this.getIsDefault()) {
                this.setIsDefault(false);
            }
            if (!this.getRepository()) {
                this.setRepository(pageState.getRepository());
            }
        },
        getTypeName: function getTypeName() {
            return this.getType().name;
        },
        isDefault: function isDefault() {
            return this.get('isDefault') || false;
        },
        isTag: function isTag() {
            return Type.isTag(this.getType());
        },
        isBranch: function isBranch() {
            return Type.isBranch(this.getType());
        },
        isCommit: function isCommit() {
            return Type.isCommit(this.getType());
        },
        isEqual: function isEqual(revisionRef) {
            return revisionRef instanceof RevisionReference && this.getId() === revisionRef.getId() && this.getType().id === revisionRef.getType().id && this.getRepository().isEqual(revisionRef.getRepository());
        }
    }, {
        fromCommit: function fromCommit(commit) {
            return new RevisionReference({
                id: commit.id,
                displayId: commit.displayId,
                type: Type.COMMIT,
                isDefault: false
            });
        },
        hydrateRefFromId: function hydrateRefFromId(id, isDefault, typeId, latestCommit) {
            if (!_.isString(id)) {
                //Brace will catch the other type errors, but we call string methods on `id` so it must be a string.
                return null;
            }

            var idRegex = /^refs\/(heads|tags)\/(.+)/;
            var displayId = id.replace(idRegex, "$2");

            if (!typeId) {
                typeId = RevisionReference.type.BRANCH;

                var match = id.match(idRegex);

                if (match && match[1] === "tags") {
                    typeId = RevisionReference.type.TAG;
                }
            }

            return new RevisionReference({ id: id, displayId: displayId, type: typeId, isDefault: isDefault, latestCommit: latestCommit });
        },
        /**
         * Deprecated Brace models have json properties overloaded onto them. Unfortunately RevisionReference has an
         * `isDefault` property that matches one of the named attributes. So it is left as a function and not a real
         * JSON value. We manually pull out the value from isDefault, but do normal hydration for the rest.
         *
         * NOTE Remove this when no longer needed in 4.0. Usages should be replaced with a simple call to `new RevisionReference(json)`
         *
         * @param revisionRefAndJSON
         * @returns {RevisionReference}
         */
        hydrateDeprecated: function hydrateDeprecated(revisionRefAndJSON) {
            if (!revisionRefAndJSON.__json) {
                // no JSON props, a normal Brace model
                return new RevisionReference(revisionRefAndJSON.toJSON());
            }
            return new RevisionReference(revisionRefAndJSON.__json);
        }
    });

    RevisionReference.type = Type;

    return RevisionReference;
});