'use strict';

define('bitbucket/internal/page/branches', ['aui', 'jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/repository/branch-table', 'bitbucket/internal/model/revision-reference', 'bitbucket/internal/page/branches/branches-page-analytics', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/events', 'bitbucket/internal/util/history', 'bitbucket/internal/widget/error-dialog', 'exports'], function (AJS, $, nav, BranchTable, RevisionReference, branchesPageAnalytics, ajax, events, history, ErrorDialog, exports) {

    'use strict';

    var previousRef;
    var branchTable;

    /**
     * Get the url to the passed ref. If no ref is passed it will return the URL to the branch list
     * @param {Object?} ref
     * @returns {string}
     */
    function getBranchListUrl(ref) {
        return nav.currentRepo().branches(ref).build();
    }

    /**
     * Show an error dialog and maybe revert back to the previous base ref
     * @param {Object} response
     * @param {Array<Object>} response.errors
     * @returns {Promise} - a jQuery Deferred
     */
    function invalidBaseRefHandler(response) {
        // fallback error message
        var errorMessage = AJS.I18n.getText('bitbucket.web.unknownerror');

        if (response.errors.length) {
            errorMessage = response.errors[0] && response.errors[0].message;
        }

        var errorDialog = new ErrorDialog({
            panelContent: bitbucket.internal.widget.paragraph({ text: errorMessage }),
            titleText: AJS.I18n.getText('bitbucket.web.branch.list.notfound')
        });

        if (!previousRef) {
            errorDialog.dialogOptions.okButtonText = AJS.I18n.getText('bitbucket.web.branch.list.back');
        }

        errorDialog.addOkListener(function (e) {
            if (previousRef) {
                // fall back to the previous ref if there is one
                history.pushState(previousRef, null, getBranchListUrl(previousRef));
                return;
            }

            // if there is ref to fall back to, pop the page to the branch list.
            window.location = getBranchListUrl();
        });

        errorDialog.show();

        // return an empty deferred to skip _all_ error handling except this one
        // (if returns true -> default REST error handling, if returns false -> default PagedTable error handling)
        return $.Deferred();
    }

    function bindBaseBranch(branchTable) {
        events.on('bitbucket.internal.page.branches.revisionRefRemoved', function (deletedRef) {
            if (!branchTable.isCurrentBase(deletedRef)) {
                branchTable.remove(deletedRef);
            } else {
                // if the current base ref was deleted, perform a full page pop
                // to reset the branch list to the default branch
                window.location = getBranchListUrl();
            }
        });
        events.on('bitbucket.internal.layout.branch.revisionRefChanged', function (selectedRef) {
            selectedRef = selectedRef.toJSON();
            history.pushState(selectedRef, null, getBranchListUrl(selectedRef));
        });

        events.on('bitbucket.internal.history.changestate', function (e) {
            var selectedRef = e.state;
            if (selectedRef) {
                previousRef = branchTable._baseRef;
                branchTable.update(selectedRef);
                events.trigger('bitbucket.internal.page.branches.revisionRefChanged', null, new RevisionReference(selectedRef));
            }
        });
    }

    function bindShortcuts(branchTable) {
        branchTable.initShortcuts();

        events.on('bitbucket.internal.widget.keyboard-shortcuts.register-contexts', function (keyboardShortcuts) {
            keyboardShortcuts.enableContext('branch-list');
        });
    }

    exports.onReady = function (containerSelector, branchTableId, repository, baseRef) {
        var $container = $(containerSelector);
        $container.append(bitbucket.internal.feature.repository.branchTable({
            repository: repository,
            baseRef: baseRef,
            id: branchTableId,
            filterable: false // The branch table is filterable but the filter is not in the default location
        }));
        branchTable = new BranchTable({
            target: '#branch-list',
            filter: 'input[data-for="branch-list"]',
            statusCode: ajax.ignore404WithinRepository(invalidBaseRefHandler)
        }, baseRef);

        branchTable.init().then(branchesPageAnalytics.bindAnalyticsEvents);

        bindBaseBranch(branchTable);
        bindShortcuts(branchTable);
    };
});