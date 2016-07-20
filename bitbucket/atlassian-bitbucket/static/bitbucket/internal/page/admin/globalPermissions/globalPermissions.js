'use strict';

define('bitbucket/internal/page/admin/globalPermissions', ['bitbucket/util/navbuilder', 'bitbucket/internal/feature/permission/permission-table', 'exports'], function (nav, permissionTable, exports) {

    exports.onReady = function (permissions, currentUserHighestPerm) {
        permissionTable.initialise(nav.admin().permissions(), permissions, currentUserHighestPerm);
    };
});