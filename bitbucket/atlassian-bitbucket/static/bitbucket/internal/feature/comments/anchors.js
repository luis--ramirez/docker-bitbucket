'use strict';

define('bitbucket/internal/feature/comments/anchors', ['jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/model/page-state'], function ($, nav, pageState) {

    'use strict';

    /**
     * Details for anchoring to a pull-requests general comments
     * @param {Object} opt_pullRequestInfo - containing projectKey, repoSlug, and pullRequestId properties
     * @api public
     * @constructor
     */

    function PullRequestAnchor(opt_pullRequestInfo) {
        opt_pullRequestInfo = opt_pullRequestInfo || {};
        this._projectKey = opt_pullRequestInfo.projectKey || pageState.getProject().getKey();
        this._repoSlug = opt_pullRequestInfo.repoSlug || pageState.getRepository().getSlug();
        this._pullRequestId = opt_pullRequestInfo.pullRequestId || pageState.getPullRequest().getId();
    }
    PullRequestAnchor.prototype.getId = function () {
        return 'pullrequest-' + this._projectKey + '-' + this._repoSlug + '-' + this._pullRequestId;
    };
    PullRequestAnchor.prototype.toJSON = function () {
        // the server doesn't want any anchor info. It NPE's if we provide it.
        return undefined;
    };
    PullRequestAnchor.prototype.urlBuilder = function () {
        return nav.rest().project(this._projectKey).repo(this._repoSlug).pullRequest(this._pullRequestId).comments();
    };

    /**
     * Details for anchoring to a diff
     * @param {FileChange} fileChange - a change object for this diff.
     * @param {Repository} repo - a repository object
     * @api public
     * @constructor
     */
    function DiffAnchor(fileChange) {
        this._path = fileChange.getPath();
        this._srcPath = fileChange.getSrcPath();
        this._commitRange = fileChange.getCommitRange();
        this._projectKey = (fileChange.getRepository() || pageState).getProject().getKey();
        this._repoSlug = (fileChange || pageState).getRepository().getSlug();
    }
    DiffAnchor.prototype.getId = function () {
        return 'diff-' + this._projectKey + '-' + this._repoSlug + '-' + this._commitRange.getId() + '-' + this._path;
    };
    DiffAnchor.prototype.toJSON = function () {
        var json = {
            path: this._path.toString(),
            commitRange: this._commitRange.toJSON()
        };
        var srcPath = this._srcPath && this._srcPath.toString();
        if (srcPath) {
            // backend can't handle an empty srcPath.
            json.srcPath = srcPath;
        }
        return json;
    };
    DiffAnchor.prototype.urlBuilder = function () {
        var navRepo = nav.rest().project(this._projectKey).repo(this._repoSlug);

        var pullRequest = this._commitRange.getPullRequest();
        if (pullRequest) {
            return navRepo.pullRequest(pullRequest.getId()).comments();
        }

        return navRepo.commit(this._commitRange.getUntilRevision().getId()).comments();
    };

    /**
     * Details for anchoring to a specific line in a diff
     * @param {DiffAnchor} diffAnchor - parent diff anchor
     * @param {string} lineType       - line type - 'ADDED', 'REMOVED', 'CONTEXT'
     * @param {number} lineNumber     - source line number for 'REMOVED' or 'CONTEXT', destination line number for 'ADDED'
     * @param {string} [fileType]     - Refers to whether the anchor is on the source file or the destination file in a diff
     *                                  Relevant to side-by-side diffs where typical value would be 'FROM' or 'TO'.
     * @api private
     * @constructor
     */
    function LineAnchor(diffAnchor, lineType, lineNumber, fileType) {
        this._diffAnchor = diffAnchor;
        this._lineType = lineType;
        this._line = lineNumber;
        this._fileType = fileType;
    }
    LineAnchor.prototype.getId = function () {
        var fileType = this._fileType ? this._fileType + '-' : '';
        return 'line-' + this._diffAnchor.getId() + '-' + fileType + this._lineType + '-' + this._line;
    };
    LineAnchor.prototype.toJSON = function () {
        var json = $.extend(this._diffAnchor.toJSON(), {
            line: this._line,
            lineType: this._lineType
        });

        if (this._fileType) {
            json.fileType = this._fileType;
        }

        return json;
    };
    LineAnchor.prototype.urlBuilder = function () {
        return this._diffAnchor.urlBuilder();
    };

    return {
        PullRequestAnchor: PullRequestAnchor,
        DiffAnchor: DiffAnchor,
        LineAnchor: LineAnchor
    };
});