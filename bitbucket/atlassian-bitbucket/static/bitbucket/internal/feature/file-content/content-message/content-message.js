'use strict';

define('bitbucket/internal/feature/file-content/content-message', ['aui', 'lodash', 'bitbucket/internal/util/events', 'exports'], function (AJS, _, events, exports) {

    'use strict';

    /**
     * Render a message explaining that there is a conflict within this file.
     *
     * @param {jQuery} $container Where to place the message
     * @param {FileChange} fileChange a model representing a changed file between two revisions and possibly two different paths.
     */

    function renderConflict($container, fileChange) {
        $container.append(bitbucket.internal.feature.fileContent.contentMessage.conflict({
            titleContent: AJS.escapeHtml(fileChange.getConflict().getConflictMessage()),
            nodeType: fileChange.getNodeType()
        }));
    }

    /**
     * Render a message explaining that there is no content changed. Fires a global event.
     *
     * @param {jQuery} $container Where to place the message
     * @param {Object} diff JSON representing a single diff, as found within the Stash /diff REST resource (as a single item in the returned array).
     * @param {FileChange} fileChange a model representing a changed file between two revisions and possibly two different paths.
     */
    function renderEmptyDiff($container, diff, fileChange) {
        $container.append(bitbucket.internal.feature.fileContent.contentMessage.emptyDiff({
            fileChangeType: fileChange.getType(),
            whitespace: diff.whitespace
        }));

        var sinceRev = fileChange.getCommitRange().getSinceRevision();
        var untilRev = fileChange.getCommitRange().getUntilRevision();

        events.trigger('bitbucket.internal.feature.fileContent.emptyDiffShown', {
            containerEl: $container.get(0),
            sourcePath: diff.source,
            sinceRevision: sinceRev && sinceRev.toJSON(),
            destinationPath: diff.destination,
            untilRevision: untilRev && untilRev.toJSON()
        });
    }

    /**
     * Render a message explaining that there is no content in this file. Fires a global event.
     *
     * @param {jQuery} $container Where to place the message
     * @param {Object} data JSON returned from the content endpoint
     * @param {JSON.FileChangeJSON} fileChangeJSON a model representing a changed file
     */
    function renderEmptyFile($container, data, fileChangeJSON) {
        $container.append(bitbucket.internal.feature.fileContent.contentMessage.emptyFile());

        var untilRev = fileChangeJSON.commitRange.untilRevision;

        events.trigger('bitbucket.internal.feature.fileContent.emptyFileShown', {
            containerEl: $container.get(0),
            path: data.path,
            commit: untilRev
        });
    }

    /**
     * Display any generic errors returned in place of source from Stash REST resources.
     *
     * @param {jQuery} $container Where to place the message
     * @param {Object} data JSON shaped like a Stash error REST response.
     */
    function renderErrors($container, data) {

        var errors = data && data.errors && data.errors.length ? data.errors : [{
            message: AJS.I18n.getText('bitbucket.web.repository.content.unknown.error')
        }];

        $container.append(_.map(errors, bitbucket.internal.feature.fileContent.contentMessage.error).join(''));
    }

    /**
     * Display a message that the diff is too large to be displayed.
     *
     * @param {jQuery} $container Where to place the message
     * @param {Object} diff JSON representing a single diff, as found within the Stash /diff REST resource (as a single item in the returned array).
     * @param {FileChange} fileChange a model representing a changed file between two revisions and possibly two different paths.
     * @param {boolean}
     */
    function renderTooLargeDiff($container, diff, fileChange, sideBySideDiffEnabled) {
        var commitRange = fileChange.getCommitRange();
        var isPR = commitRange.getPullRequest();

        $container.append(bitbucket.internal.feature.fileContent.contentMessage.tooLargeDiff({
            filePath: diff.destination ? diff.destination.toString : diff.source.toString,
            revisionId: !isPR && commitRange.getUntilRevision() && commitRange.getUntilRevision().getId(),
            parentRevisionId: !isPR && commitRange.getSinceRevision() && commitRange.getSinceRevision().getId(),
            sideBySideDiffEnabled: sideBySideDiffEnabled
        }));
    }

    exports.renderConflict = renderConflict;
    exports.renderEmptyDiff = renderEmptyDiff;
    exports.renderEmptyFile = renderEmptyFile;
    exports.renderErrors = renderErrors;
    exports.renderTooLargeDiff = renderTooLargeDiff;
});