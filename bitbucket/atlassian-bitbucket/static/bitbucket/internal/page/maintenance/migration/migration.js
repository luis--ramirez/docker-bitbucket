'use strict';

define('bitbucket/internal/page/maintenance/migration', ['aui', 'bitbucket/util/navbuilder', 'bitbucket/internal/layout/maintenance', 'exports'], function (AJS, nav, maintenance, exports) {
    exports.onReady = function (hasToken) {

        var opts = {
            redirectUrl: hasToken ? nav.admin().db().build() : nav.allProjects().build(),
            canceledHeader: AJS.I18n.getText('bitbucket.web.migration.canceled.title'),
            cancelingDescription: AJS.I18n.getText('bitbucket.web.migration.canceling.description'),
            cancelDialogTitle: AJS.I18n.getText('bitbucket.web.migration.dialog.title'),
            cancelDialogDescription: AJS.I18n.getText('bitbucket.web.migration.dialog.description', bitbucket.internal.util.productName()),
            cancelDialogButtonText: AJS.I18n.getText('bitbucket.web.migration.dialog.cancel')
        };

        maintenance.init(opts);
    };
});