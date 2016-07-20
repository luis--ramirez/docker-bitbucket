'use strict';

define('bitbucket/internal/model-transformer', ['bitbucket/internal/bbui/models/models', 'exports'], function (models, exports) {
    'use strict';

    /**
     * Stashify a tranformer function output. It calls the transformer function and
     * appends a `_stash` property to it for legacy use.
     *
     * @param {Function} transformer
     * @returns {Function}
     */

    function stashify(transformer) {
        return function (stashModel /*[, args]*/) {
            var transformedModel = transformer.apply(null, arguments);
            if (transformedModel) {
                transformedModel._stash = stashModel;
            }
            return transformedModel;
        };
    }

    /**
     * @param {JSON.StashUserJSON} userModel
     * @returns {model.user}
     */
    function user(userModel) {
        if (!userModel) {
            return null;
        }
        return {
            avatar_url: userModel.avatarUrl,
            display_name: userModel.displayName,
            email_address: userModel.emailAddress,
            is_active: Boolean(userModel.active),
            is_admin: Boolean(userModel.isAdmin),
            name: userModel.name,
            slug: userModel.slug,
            type: userModel.type
        };
    }

    /**
     * @param {JSON.StashUserJSON} participantModel
     * @param {models.UserRole} userRole
     * @returns {{user: models.user, role: models.UserRole, state: models.ApprovalState}}
     */
    function abstractParticipant(participantModel, userRole) {
        if (!participantModel) {
            return null;
        }
        return {
            role: userRole,
            state: participantModel.status,
            user: user(participantModel.user)
        };
    }

    /**
     * An Author user
     *
     * @param {JSON.StashUserJSON} participantModel
     * @returns {{user: models.user, role: models.UserRole, state: models.ApprovalState}}
     */
    function author(participantModel) {
        return abstractParticipant(participantModel, models.UserRole.AUTHOR);
    }

    /**
     * A Reviewer user
     *
     * @param {JSON.StashUserJSON} participantModel
     * @returns {{user: models.user, role: models.UserRole, state: models.ApprovalState}}
     */
    function reviewer(participantModel) {
        return abstractParticipant(participantModel, models.UserRole.REVIEWER);
    }

    /**
     * A Participant user
     *
     * @param {JSON.StashUserJSON} participantModel
     * @returns {{user: models.user, role: bitbucket/internal/models.UserRole, state: string}}
     */
    function participant(participantModel) {
        return abstractParticipant(participantModel, models.UserRole.PARTICIPANT);
    }

    /**
     * Convert a given timestamp to an ISO date string
     *
     * @param {string|number} timestamp
     * @returns {string}
     */
    function date(timestamp) {
        if (!timestamp) {
            return null;
        }
        return new Date(timestamp).toISOString();
    }

    /**
     * @param {JSON.RefJSON} ref
     * @param {models.RefType} type
     * @param {models.repository} fallback repository if the ref doesn't have one as a property
     * @returns {models.ref}
     */
    function ref(refModel, type, repo) {
        if (!refModel) {
            return null;
        }
        return {
            display_id: refModel.displayId,
            id: refModel.id,
            is_default: Boolean(refModel.isDefault),
            latest_commit: refModel.latestCommit,
            repository: repository(refModel.repository) || repo,
            type: type
        };
    }

    /**
     * @param {JSON.ProjectJSON} proj
     * @returns {models.project}
     */
    function project(proj) {
        if (!proj) {
            return null;
        }
        return {
            id: String(proj.id),
            name: proj.name,
            key: proj.key,
            description: proj.description || '',
            type: proj.type,
            owner: user(proj.owner),
            is_public: proj.public || false,
            avatar_url: proj.avatarUrl
        };
    }

    /**
     * @param {JSON.RepositoryJSON} repo
     * @returns {models.repository}
     */
    function repository(repo) {
        if (!repo) {
            return null;
        }
        return {
            id: String(repo.id),
            is_forkable: repo.forkable,
            is_public: repo.public,
            name: repo.name,
            origin: repository(repo.origin),
            project: project(repo.project),
            scm_id: repo.scmId,
            slug: repo.slug
        };
    }

    function pullRequest(pr) {
        if (!pr) {
            return null;
        }
        return {
            author: author(pr.author),
            created_date: date(pr.createdDate),
            description: pr.description,
            from_ref: ref(pr.fromRef, models.RefType.BRANCH),
            id: String(pr.id),
            participants: pr.participants.map(participant),
            reviewers: pr.reviewers.map(reviewer),
            state: pr.state,
            title: pr.title,
            to_ref: ref(pr.toRef, models.RefType.BRANCH),
            updated_date: date(pr.updatedDate),
            version: pr.version,
            comment_count: pr.properties && pr.properties.commentCount || 0,
            task_count: pr.properties && pr.properties.openTaskCount
        };
    }

    exports.user = stashify(user);
    exports.author = stashify(author);
    exports.reviewer = stashify(reviewer);
    exports.participant = stashify(participant);
    exports.date = date;
    exports.ref = stashify(ref);
    exports.repository = stashify(repository);
    exports.project = stashify(project);
    exports.pullRequest = stashify(pullRequest);
});