'use strict';

define('bitbucket/internal/page/maintenance/backup', ['aui', 'bitbucket/util/navbuilder', 'bitbucket/internal/layout/maintenance', 'exports'], function (AJS, nav, maintenance, exports) {

    exports.onReady = function (hasToken) {

        var opts = {
            redirectUrl: hasToken ? nav.admin().build() : nav.allProjects().build(),
            canceledHeader: AJS.I18n.getText('bitbucket.web.backup.canceled.title'),
            cancelingDescription: AJS.I18n.getText('bitbucket.web.backup.canceling.description'),
            cancelDialogTitle: AJS.I18n.getText('bitbucket.web.backup.dialog.title'),
            cancelDialogDescription: AJS.I18n.getText('bitbucket.web.backup.dialog.description'),
            cancelDialogButtonText: AJS.I18n.getText('bitbucket.web.backup.dialog.cancel')
        };

        maintenance.init(opts);
    };
});