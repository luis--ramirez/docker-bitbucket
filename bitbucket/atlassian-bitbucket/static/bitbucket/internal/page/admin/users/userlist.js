'use strict';

define('bitbucket/internal/page/admin/usersList', ['aui', 'bitbucket/internal/feature/user/user-table', 'bitbucket/internal/util/notifications', 'bitbucket/internal/widget/delete-dialog', 'exports'], function (AJS, UserTable, notifications, deleteDialog, exports) {

    exports.onReady = function (tableSelector, deleteLinksSelector) {

        notifications.showFlashes();

        var userTable = new UserTable({
            target: tableSelector
        });

        userTable.init();

        // confirm dialog to delete groups
        deleteDialog.bind(deleteLinksSelector, AJS.I18n.getText('bitbucket.web.user.delete'), AJS.I18n.getText('bitbucket.web.user.delete.success'), AJS.I18n.getText('bitbucket.web.user.delete.fail'), function (displayName) {
            notifications.addFlash(AJS.I18n.getText('bitbucket.web.user.delete.success', displayName));
            location.reload();
        });
    };
});