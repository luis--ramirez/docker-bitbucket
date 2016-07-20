'use strict';

define('bitbucket/internal/page/admin/groupsList', ['aui', 'bitbucket/internal/feature/user/group-table', 'bitbucket/internal/util/notifications', 'bitbucket/internal/widget/delete-dialog', 'exports'], function (AJS, GroupTable, notifications, deleteDialog, exports) {

    exports.onReady = function (tableSelector, deleteLinksSelector) {

        notifications.showFlashes();

        var groupTable = new GroupTable({
            target: tableSelector
        });

        groupTable.init();

        // confirm dialog to delete groups
        deleteDialog.bind(deleteLinksSelector, AJS.I18n.getText('bitbucket.web.group.delete'), AJS.I18n.getText('bitbucket.web.group.delete.success'), AJS.I18n.getText('bitbucket.web.group.delete.fail'), function (group) {
            notifications.addFlash(AJS.I18n.getText('bitbucket.web.group.delete.success', group));
            location.reload();
        });
    };
});