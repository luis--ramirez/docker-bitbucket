'use strict';

define('bitbucket/internal/feature/pull-request-list-dialog', ['aui', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/pull-request/pull-request-table', 'bitbucket/internal/model/page-state', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/events', 'bitbucket/internal/widget/avatar-list'], function (AJS, $, _, nav, PullRequestsTable, pageState, ajax, events, AvatarList) {

    'use strict';

    var dialog;
    var pullRequestTable;

    function getPullRequestsUrlBuilder() {
        return nav.rest().currentRepo().allPullRequests();
    }

    function bindKeyboardShortcuts() {
        pullRequestTable.initShortcuts();

        events.on('bitbucket.internal.widget.keyboard-shortcuts.register-contexts', function (keyboardShortcuts) {
            keyboardShortcuts.enableContext('pull-request-list');
        });

        events.on('bitbucket.internal.keyboard.shortcuts.requestMoveToNextHandler', pullRequestTable.bindMoveToNextHandler);
        events.on('bitbucket.internal.keyboard.shortcuts.requestMoveToPreviousHandler', pullRequestTable.bindMoveToPreviousHandler);
        events.on('bitbucket.internal.keyboard.shortcuts.requestOpenItemHandler', pullRequestTable.bindOpenItemHandler);
        events.on('bitbucket.internal.keyboard.shortcuts.pullrequest.requestHighlightAssignedHandler', pullRequestTable.bindHighlightAssignedHandler);
    }

    function createPullRequestListDialog(content, direction, sourceBranch, state, order) {
        var dialog = new AJS.Dialog({
            width: 980,
            height: 480,
            id: "pull-request-list-dialog",
            closeOnOutsideClick: true
        }).addHeader(AJS.I18n.getText('bitbucket.web.pullrequest.listdialog.header'));

        pullRequestTable = new PullRequestsTable(state, order, getPullRequestsUrlBuilder, {
            direction: direction,
            source: sourceBranch
        });

        dialog.addPanel('', content);
        dialog.addCancel(AJS.I18n.getText('bitbucket.web.button.close'), _.bind(dialog.hide, dialog));

        return dialog;
    }

    function getInjectedData() {
        return {
            principal: pageState.getCurrentUser().toJSON()
        };
    }

    function updateContent(pullRequests) {
        dialog.getCurrentPanel().html(bitbucket.internal.feature.pullRequest.pullRequestTable({ pullRequestPage: pullRequests, showStatus: 'true', hideAuthorName: 'true' }, null, getInjectedData()));

        pullRequestTable.init();
        AvatarList.init();

        bindKeyboardShortcuts();

        return dialog;
    }

    function removeDialog() {
        $(document).off('hideLayer', removeDialog);
        if (dialog) {
            dialog.remove();
            dialog = null;
        }
        if (pullRequestTable) {
            pullRequestTable = null;
        }
    }

    function cancelDialog(dialog) {
        if (dialog) {
            // the event handler for 'hideLayer' will automatically remove the dialog from the DOM
            dialog.hide();
        }
    }

    function fetchResults(dialog) {
        return ajax.rest({
            url: pullRequestTable.buildUrl(0, 25)
        }).fail(function () {
            // cancel the dialog, since the default error handling from ajax.rest() will
            // also show an error dialog (or redirect to the login page);
            // this avoids having the error dialog showing up on top of the pull request dialog.
            cancelDialog(dialog);
        }).done(function (page) {
            updateContent(page);
            dialog.updateHeight();
        });
    }

    return {
        /**
         * Pops up a dialog with a list of pull requests fetched from the server matching the supplied parameters.
         *
         * @param {String} direction the directions of the pull requests you want to display used with sourceBranch (optional)
         * @param {String} sourceBranch the branch to show pull requests for (optional)
         * @param {String} state only show pull requests in this state (defaults to open)
         * @param {String} order the order to show the pull requests in either 'newest' or 'oldest' first
         * */
        showFor: function showFor(direction, sourceBranch, state, order) {
            removeDialog();
            $(document).on('hideLayer', removeDialog);

            var $spinner = $('<div class="spinner"></div>');
            dialog = createPullRequestListDialog($spinner, direction, sourceBranch, state, order);
            dialog.show();

            $spinner.show().spin('large');

            fetchResults(dialog).always(function () {
                $spinner.spinStop().remove();
            });
        }
    };
});