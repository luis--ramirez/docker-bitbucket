'use strict';

define('bitbucket/internal/page/admin/groupEdit', ['aui', 'jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/user/group-users-table', 'bitbucket/internal/util/notifications', 'bitbucket/internal/widget/delete-dialog', 'exports'], function (AJS, $, nav, GroupUsersTable, notifications, DeleteDialog, exports) {

    exports.onReady = function (readOnly, groupUsersTableSelector, deleteLinkSelector) {

        // dialog to confirm the deletion of the group
        DeleteDialog.bind(deleteLinkSelector, AJS.I18n.getText('bitbucket.web.group.delete'), AJS.I18n.getText('bitbucket.web.group.delete.success'), AJS.I18n.getText('bitbucket.web.group.delete.fail'), function (name) {
            notifications.addFlash(AJS.I18n.getText('bitbucket.web.group.delete.success', name));
            window.location = nav.admin().groups().build();
            return false; // don't notify on view page, wait for page-pop
        }, function () {
            return $('#group-name').text();
        });

        // list of users in the group
        var usersTable = new GroupUsersTable({
            target: groupUsersTableSelector
        });
        usersTable.init();
    };
});