define('bitbucket/internal/bbui/models/models', ['exports', 'lodash', '../json-validation/json-validation'], function (exports, _lodash, _jsonValidation) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.permission = exports.file_text = exports.file_metadata = exports.changeset = exports.task = exports.comment = exports.pull_request = exports.participant = exports.reviewer = exports.author = exports.BranchStability = exports.PullRequestState = exports.SelfAction = exports.ApprovalState = exports.UserRole = exports.ParticipantRole = exports.ref = exports.RefType = exports.repository = exports.project = exports.user = exports.scmId = exports.ProjectType = exports.UserType = exports.person = undefined;

    var _lodash2 = babelHelpers.interopRequireDefault(_lodash);

    var _jsonValidation2 = babelHelpers.interopRequireDefault(_jsonValidation);

    /**
     * Any person. Could be a user of the application, a committer to a repository, etc.
     *
     * @class Person
     * @property {string?} email_address - email for the user. Usually only appears on the current user
     * @property {string} name - @username for the user
     */
    /*eslint camelcase:0 */
    var person = exports.person = {
        email_address: 'string?',
        name: 'string'
    };

    /**
     * A user type
     * @enum {string}
     */
    var UserType = exports.UserType = {
        NORMAL: 'NORMAL',
        SERVICE: 'SERVICE'
    };

    /**
     * A project type
     * @enum {string}
     */
    var ProjectType = exports.ProjectType = {
        NORMAL: 'NORMAL',
        PERSONAL: 'PERSONAL'
    };

    /**
     * The SCM id
     * @enum {string}
     */
    var scmId = exports.scmId = {
        GIT: 'git',
        HG: 'hg'
    };

    /**
     * A person who is a user of this application.
     *
     * Note that the following properties will be used by frontend components directly.
     * In order to satisfy some SPIs, you may need additional properties on your model.
     * For example, Server needs an avatarUrl property to accurately provide avatar urls in
     * bitbucket/internal/urls
     *
     * @class User
     * @extends Person
     * @param {boolean} is_active - whether the user still has an active account
     * @param {string} display_name - the name to show in UI for the user
     * @param {boolean} is_admin - whether the user is an instance-wide admin. Can be used to
     *                            provide extra links/actions that are only available to instance
     *                            admins (e.g., edit other users, etc). Of course checks on the
     *                            backend should stop non-admins from making use of those links
     *                            regardless of this value.
     * @param {UserType} type - is this a real person or service user?
     * @param {string} avatar_url - The URL to the avatar of this user.
     */
    var user = exports.user = _lodash2.default.extend({}, person, {
        avatar_url: 'string',
        display_name: 'string',
        is_active: 'boolean',
        is_admin: 'boolean',
        slug: 'string?',
        type: _jsonValidation2.default.asEnum('UserType', UserType)
    });

    // Currently (as of 2015-07-07) only Server has the concept of a Project
    var project = exports.project = {
        id: 'string',
        name: 'string',
        key: 'string',
        description: 'string?',
        type: _jsonValidation2.default.asEnum('ProjectType', ProjectType),
        owner: _jsonValidation2.default.nullable(user),
        is_public: 'boolean'
    };

    var repository = exports.repository = {
        id: 'string',
        name: 'string',
        slug: 'string',
        is_forkable: 'boolean',
        is_public: 'boolean',
        origin: _jsonValidation2.default.nullable(_jsonValidation2.default.recurse(function () {
            return repository;
        })),
        scm_id: _jsonValidation2.default.asEnum('scmId', scmId)
    };

    /**
     * The type of a ref
     * @enum {string}
     */
    var RefType = exports.RefType = {
        TAG: 'tag',
        BRANCH: 'branch',
        COMMIT: 'commit'
    };

    var ref = exports.ref = {
        id: 'string',
        display_id: 'string',
        type: _jsonValidation2.default.asEnum('RefType', RefType),
        is_default: 'boolean',
        latest_commit: 'string?',
        repository: _jsonValidation2.default.nullable(repository)
    };

    /**
     * Pull request participant's role
     * @enum {string}
     */
    var ParticipantRole = exports.ParticipantRole = {
        AUTHOR: 'author',
        REVIEWER: 'reviewer',
        PARTICIPANT: 'participant'
    };

    var UserRole = exports.UserRole = ParticipantRole;

    /**
     * Pull request Participant's approval state of the pull request
     * @enum {string}
     */
    var ApprovalState = exports.ApprovalState = {
        APPROVED: 'APPROVED',
        NEEDS_WORK: 'NEEDS_WORK',
        UNAPPROVED: 'UNAPPROVED'
    };

    /**
     * User's actions to add/remove themselves from a PR
     * @enum {string}
     */
    var SelfAction = exports.SelfAction = {
        ADD_SELF: 'ADD_SELF',
        REMOVE_SELF: 'REMOVE_SELF'
    };

    /**
     * Pull request state
     * @enum {string}
     */
    var PullRequestState = exports.PullRequestState = {
        OPEN: 'OPEN',
        MERGED: 'MERGED',
        DECLINED: 'DECLINED'
    };

    var BranchStability = exports.BranchStability = {
        STABLE: 'stable',
        UNSTABLE: 'unstable'
    };

    var abstractParticipant = {
        user: user,
        role: _jsonValidation2.default.asEnum('Role', ParticipantRole),
        state: _jsonValidation2.default.asEnum('ApprovalState', ApprovalState)
    };
    var author = exports.author = _lodash2.default.extend({}, abstractParticipant, { role: _jsonValidation2.default.strictEqual(ParticipantRole.AUTHOR) });
    var reviewer = exports.reviewer = _lodash2.default.extend({}, abstractParticipant, { role: _jsonValidation2.default.strictEqual(ParticipantRole.REVIEWER) });
    var participant = exports.participant = _lodash2.default.extend({}, abstractParticipant, { role: _jsonValidation2.default.strictEqual(ParticipantRole.PARTICIPANT) });

    var pull_request = exports.pull_request = {
        author: author,
        description: 'string?',
        description_as_html: 'string?',
        created_date: 'string', // should be an ISO-8601 time string
        comment_count: 'number',
        from_ref: ref,
        id: 'string?',
        participants: [participant],
        reviewers: [reviewer],
        state: _jsonValidation2.default.asEnum('PullRequestState', PullRequestState),
        task_count: 'number',
        title: 'string?',
        titleHtml: 'string?',
        to_ref: ref,
        updated_date: 'string', // should be an ISO-8601 time string
        version: 'number?'
    };

    var comment = exports.comment = {}; // TODO

    var task = exports.task = {}; // TODO

    // a change between two commits, including file diffs.
    var changeset = exports.changeset = {}; // TODO

    // information about a file - e.g. filename, binary vs text, etc.
    var file_metadata = exports.file_metadata = {}; // TODO

    // the source of a text file.
    var file_text = exports.file_text = {}; // TODO

    var permission = exports.permission = {
        name: _jsonValidation2.default.asEnum('permission', {
            KNOWN_USER: 'KNOWN_USER', // == LICENSED_USER on Server -> any logged-in user
            REPO_READ: 'REPO_READ', // can view the given repo
            REPO_WRITE: 'REPO_WRITE', // can push to the given repo
            REPO_ADMIN: 'REPO_ADMIN', // can administrate the given repo
            SYS_ADMIN: 'SYS_ADMIN' }),
        // on Cloud, I suspect this is just the Bitbucket team.
        project_id: 'string?', // in Server this is a number.
        project_key: 'string?', // the URL identifier for the project
        repository_id: 'string?', // in Server this is a number
        repository_slug: 'string?' };

    exports.default = {

        // Enums
        ApprovalState: ApprovalState,
        BranchStability: BranchStability,
        ProjectType: ProjectType,
        PullRequestState: PullRequestState,
        RefType: RefType,
        ParticipantRole: ParticipantRole,
        SelfAction: SelfAction,
        scmId: scmId,
        UserRole: ParticipantRole,
        UserType: UserType,

        // Models
        author: author,
        changeset: changeset,
        comment: comment,
        file_metadata: file_metadata,
        file_text: file_text,
        participant: participant,
        permission: permission,
        person: person,
        project: project,
        pull_request: pull_request,
        ref: ref,
        repository: repository,
        reviewer: reviewer,
        task: task,
        user: user
    };
});