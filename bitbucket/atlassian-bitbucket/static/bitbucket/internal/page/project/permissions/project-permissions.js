'use strict';

define('bitbucket/internal/page/project/permissions', ['jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/permission/permission-table', 'bitbucket/internal/page/project/permissions/project-permissions-model', // TODO: This should not be in the page namespace
'bitbucket/internal/widget/submit-spinner', 'exports'], function ($, nav, permissionTable, ProjectPermissionsModel, SubmitSpinner, exports) {

    exports.onReady = function (permissions) {
        var licensedUserNoAccessRadio = getLicensedUserPermsRadios('none');
        var publicAccessCheckbox = $('#public-access-allowed');
        var publicAccessSpinner;
        var currentPublicAccessXHR;

        var projectPermissions = new ProjectPermissionsModel({
            grantedDefaultPermission: $('#licensed-users-permissions').attr('data-granted-permission'),
            publicAccess: !!publicAccessCheckbox.prop('checked') // If checkbox is not present, default to false
        });

        function getLicensedUserPermsRadios(value) {
            var selector = 'input:radio[name="licensed-users-permissions"]';
            if (value) {
                selector += '[value="' + value + '"]';
            }
            return $(selector);
        }

        projectPermissions.on('change:grantedDefaultPermission', function (model) {
            getLicensedUserPermsRadios(model.getGrantedDefaultPermission()).prop('checked', true);
        });

        projectPermissions.on('change:publicAccess', function (model) {
            getLicensedUserPermsRadios(model.getEffectiveDefaultPermission()).prop('checked', true);
            licensedUserNoAccessRadio.prop('disabled', model.getPublicAccess());
            publicAccessCheckbox.prop('checked', model.getPublicAccess());
        });

        /* event handlers */
        getLicensedUserPermsRadios().each(function () {
            var spinner;
            var currentXHR;
            $(this).click(function () {
                if (!spinner) {
                    spinner = new SubmitSpinner($(this).next('label'));
                }
                if (currentXHR) {
                    currentXHR.abort();
                }
                spinner.show();
                var selectedValue = getLicensedUserPermsRadios().filter(":checked").val();
                currentXHR = projectPermissions.saveDefaultPermission(selectedValue);
                currentXHR.always(function () {
                    spinner.hide();
                    currentXHR = null;
                });
            });
        });

        publicAccessCheckbox.click(function () {
            if (!publicAccessSpinner) {
                publicAccessSpinner = new SubmitSpinner($(this).next('label'));
            }
            if (currentPublicAccessXHR) {
                currentPublicAccessXHR.abort();
            }
            publicAccessSpinner.show();
            currentPublicAccessXHR = projectPermissions.savePublicAccess(this.checked);
            currentPublicAccessXHR.always(function () {
                publicAccessSpinner.hide();
                currentPublicAccessXHR = null;
            });
        });

        licensedUserNoAccessRadio.next('label').tooltip({
            gravity: 'sw',
            title: function title() {
                return projectPermissions.getPublicAccess() ? licensedUserNoAccessRadio.parent().attr('data-disabled-title') : '';
            }
        });

        /* permission table*/
        var permControls = permissionTable.initialise(nav.currentProject().permissions(), permissions, 'PROJECT_ADMIN' //If the user can see this page, then the UI should act like they have project admin permissions
        );
    };
});