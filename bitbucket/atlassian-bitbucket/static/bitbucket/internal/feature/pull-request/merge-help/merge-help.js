'use strict';

define('bitbucket/internal/feature/pull-request/merge-help', ['aui', 'bitbucket/util/navbuilder', 'bitbucket/internal/util/events'], function (AJS, nav, events) {

    var dialog;
    var conflictResolutionInstructionsMarkup;

    function mergeHelpDialog(pullRequest, conflicted, vetoes, properties) {
        // If dialog does not exist create it
        if (!dialog) {
            dialog = AJS.dialog2(bitbucket.internal.feature.pullRequest.mergeHelpDialog());
            dialog.$el.find('.dialog-close-button').click(function () {
                dialog.hide();
            });

            // we manually add the dialog to the body so that it's on the DOM and available for the automerge-decorator
            // to replace the contents if necessary
            dialog.$el.appendTo('body');
        }
        // If the dialog already exists just update the inner content.
        dialog.$el.find('.aui-dialog2-content').html(mergeHelpMarkup(pullRequest, conflicted, vetoes));
    }

    /**
     * Get the merge help markup for the merge help dialog
     * @param {PullRequest} pullRequest - the pull request
     * @param {boolean} conflicted - is the pull request conflicted
     * @param {?Array<Object>} vetoes - the list of vetoes for the pull request
     * @param {boolean?} conflictMarkupOnly - fetch conflict markup only? (will fetch conflict markup for stable source branches)
     * @returns {string} the markup
     */
    function mergeHelpMarkup(pullRequest, conflicted, vetoes, conflictMarkupOnly) {
        var sourceRepo = pullRequest.getFromRef().getRepository();
        var targetRepo = pullRequest.getToRef().getRepository();
        var sourceRemote = null;
        var targetRemote = null;

        if (!sourceRepo.isEqual(targetRepo)) {
            sourceRemote = nav.project(sourceRepo.getProject()).repo(sourceRepo).clone(sourceRepo.getScmId()).buildAbsolute();
            targetRemote = nav.project(targetRepo.getProject()).repo(targetRepo).clone(targetRepo.getScmId()).buildAbsolute();
        }

        var soyParams = {
            sourceBranch: pullRequest.getFromRef().getDisplayId(),
            targetBranch: pullRequest.getToRef().getDisplayId(),
            sourceRemote: sourceRemote,
            targetRemote: targetRemote,
            conflicted: conflicted,
            vetoes: vetoes
        };

        if (conflictMarkupOnly) {
            return bitbucket.internal.feature.pullRequest.mergeInstructionsForStableSourceBranch(soyParams);
        }

        return bitbucket.internal.feature.pullRequest.mergeHelp(soyParams);
    }

    /**
     * Get conflict markup only
     * @param {PullRequest} pullRequest
     * @param {boolean} conflicted
     * @returns {string}
     */
    function mergeHelpConflictMarkup(pullRequest, conflicted) {
        // If conflict resolution instructions already exist, because they've been
        // passed along from somewhere else, use them instead.
        if (conflictResolutionInstructionsMarkup) {
            return conflictResolutionInstructionsMarkup;
        }

        return mergeHelpMarkup(pullRequest, conflicted, null, true);
    }

    function showMergeHelpDialog() {
        if (dialog) {
            dialog.show();
        }
    }

    var cantMergeHandler = function cantMergeHandler(pullRequest, conflicted, vetoes, properties) {
        mergeHelpDialog(pullRequest, conflicted, vetoes, properties);
    };

    return {
        init: function init() {
            events.on('bitbucket.internal.pull-request.cant.merge', cantMergeHandler);
            events.on('bitbucket.internal.pull-request.show.cant.merge.help', showMergeHelpDialog);
        },
        reset: function reset() {
            events.off('bitbucket.internal.pull-request.cant.merge', cantMergeHandler);
            events.off('bitbucket.internal.pull-request.show.cant.merge.help', showMergeHelpDialog);
            if (dialog) {
                dialog.remove();
                dialog = null;
            }
        },
        mergeHelpConflictMarkup: mergeHelpConflictMarkup
    };
});