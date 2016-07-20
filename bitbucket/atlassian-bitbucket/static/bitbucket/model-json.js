/** @namespace JSON */

/**
 * Describes a range of commits, with a topographical beginning (since) and end (until).
 *
 * @typedef {Object} CommitRangeJSON
 * @memberOf JSON
 *
 * @property {JSON.CommitJSON}     sinceRevision - The first revision of the range of commits.
 * @property {JSON.CommitJSON}     untilRevision - The last revision of the range of commits.
 */

/**
 * Metadata about a change to a file.
 *
 * @typedef {Object}    FileChangeJSON
 * @memberOf JSON
 *
 * @property {JSON.RepositoryJSON}   repository - The repository containing the file that was changed.
 * @property {JSON.CommitRangeJSON}  commitRange - The since revision and the until revision of the file change.
 * @property {JSON.PathJSON}         path - The path to the changed content.
 * @property {JSON.PathJSON}         [srcPath] - The path at which the changed content originated, if different from `path`.
 * @property {Object}                [diff] - The diff of the file change. The structure matches the structure for diffs
 *                                       retrieved via the REST API. This is only provided for handling diffs as
 *                                       activity items for a pull request. For other usages, diffs must be retrieved
 *                                       from the server.
 */

/**
 * Describes a project in Stash.
 *
 * @typedef {Object} ProjectJSON
 * @memberOf JSON
 *
 * @property {number}       id - An identifier for the project.
 * @property {string}       name - The name of the project.
 * @property {string}       key - The key of the project.
 * @property {boolean}      public - True if the project is publicly accessible.
 * @property {string}       avatarUrl - A URL to the project's avatar.
 */

/**
 * Describes a pull request participant in Stash.
 *
 * @typedef {Object} ParticipantJSON
 * @memberof JSON
 *
 * @property {boolean}      approved - Whether this participant has approved the pull request.
 * @property {string}       role - "AUTHOR", "REVIEWER", or "PARTICIPANT"
 * @property {JSON.StashUserJSON} user - The user participating in the pull request.
 */

/**
 * Describes a pull request in Stash.
 *
 * @typedef {Object} PullRequestJSON
 * @memberof JSON
 *
 * @property {JSON.ParticipantJSON} author - The author of the pull request.
 * @property {string}       createdDate - The date the pull request was first created, in ISO-8601 form.
 * @property {string}       description - The user-provided description for this pull request.
 * @property {string}       descriptionAsHtml - The rendered HTML result for the user-provided description.
 * @property {number}       id - The ID of the pull request, unique within its repository.
 * @property {JSON.RefJSON} fromRef - The ref describing the source of this pull request.
 * @property {Array<JSON.ParticipantJSON>} participants - Non-reviewer participants in the pull request.
 * @property {Array<JSON.ParticipantJSON>} reviewers - Explicitly listed reviewers of the pull request.
 * @property {string}       title - The title of the pull request.
 * @property {JSON.RefJSON} toRef - The ref describing the target/destination of this pull request.
 * @property {string}       updatedDate - The date the pull request was last updated, in ISO-8601 form.
 * @property {number}       version - A number describing the version of this pull request, updated when the pull request is changed.
 */

/**
 * Describes a ref in Stash (e.g. a Git branch or tag).
 *
 * @typedef {Object} RefJSON
 * @memberof JSON
 *
 * @property {string}       displayId - A user-facing id for the ref. No guarantees are made about the format of the output.
 * @property {string}       id - A unique identifier for the ref, within its repository.
 * @property {boolean}      isDefault - Whether this is the default ref for the repository.
 * @property {string}       hash - Tags can also have a hash property when they aren't simply pointers to a commit. It points to the rich tag object
 * @property {string}       latestCommit - The hash for the most recent commit on the branch.
 * @property {JSON.RepositoryJSON} repository - The repository this ref is associated with.
 * @property {Object}       type - Contains an id property with value 'tag', 'branch', or 'commit', describing the kind of ref this is.
 */

/**
 * Describes a repository in Stash.
 *
 * @memberOf JSON
 * @typedef {Object} RepositoryJSON
 *
 * @property {number}       id - An identifier for the repository.
 * @property {string}       name - The name of the repository.
 * @property {string}       slug - The slug of the repository which is a URL-friendly variant of its name.
 * @property {JSON.ProjectJSON}  project - The project the repository belongs to.
 * @property {string}       scmId - The identifier of the repository's SCM.
 * @property {boolean}      public - True if the repository is publicly accessible.
 * @property {string}       cloneUrl - The repository's HTTP clone URL.
 */

/**
 * Describes a single, specific commit.
 *
 * @typedef {Object} CommitJSON
 * @memberOf JSON
 *
 * @property {string}       id - An identifier for the commit. For Git repositories, this is the SHA-1 hash.
 * @property {string}       displayId - An identifier for the commit suitable for displaying in the UI.
 */

/**
 * Describes a user in Stash.
 *
 * @typedef {Object} StashUserJSON
 * @memberof JSON
 *
 * @property {boolean}      active - True if the user is an active user.
 * @property {string}       [avatarUrl] - A URL where the user's avatar can be retrieved. This property's availability depends on the caller providing a requested avatarSize when the user data is requested.
 * @property {string}       displayName - The user's human-readable name. E.g. Adam Ahmed
 * @property {string}       emailAddress - The user's email address.
 * @property {number}       id - A numeric unique ID for the user.
 * @property {string}       name - The login/username for the user.
 * @property {string}       slug - A URL-safe id for the user. Use this when constructing URLs for user information.
 * @property {string}       type - Currently "NORMAL" or "SERVICE", where "SERVICE" users are not backed by a Crowd entity and cannot authenticate via the UI.
 */

/**
 * Describe a Path in Stash
 *
 * @typedef {Object} PathJSON
 * @memberof JSON
 *
 * @property {Array<string>} components - an array of path components
 * @property {string}        extension  - file extension, if any (and an empty string if there isn't)
 * @property {string}        name       - the file name
 *
 */
define("bitbucket/model-json", [], function () {});