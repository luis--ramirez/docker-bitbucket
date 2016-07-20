'use strict';

define('bitbucket/internal/feature/admin/db/editDbConfig', ['aui', 'jquery', 'lodash', 'exports'], function (AJS, $, _, exports) {

    function updateDatabaseMessages(dbType) {
        var $type = $("#type");
        var $fieldGroup = $type.closest('.field-group');
        var $container = $fieldGroup.parent();

        $fieldGroup.find('.help-url').attr('href', dbType.helpUrl);
        $fieldGroup.find('.driver-unavailable').toggleClass('hidden', dbType.driverAvailable || !dbType.dcSupported);
        $fieldGroup.find('.not-clusterable').toggleClass('hidden', dbType.dcSupported).find('.not-clusterable-database').text(dbType.displayName);

        $container.find("input").add($("#test,#submit")).toggleClass('disabled', !(dbType.dcSupported && dbType.driverAvailable)).prop('disabled', !(dbType.dcSupported && dbType.driverAvailable));
    }

    function toggleDatabaseLabel(dbType) {
        // Replace the text in the first textNode. Using .text() will remove all innerHtml
        var $fieldGroup = $('#database').closest('.field-group');
        var $label = $fieldGroup.children('label');
        var $labelChildren = $label.children();
        var $description = $fieldGroup.children('.description');
        var labelText;
        var descriptionText;
        if (dbType.usesSid) {
            labelText = AJS.I18n.getText('bitbucket.web.admin.db.service.label');
            descriptionText = AJS.I18n.getText('bitbucket.web.admin.db.service.description');
        } else {
            labelText = AJS.I18n.getText('bitbucket.web.admin.db.database.label');
            descriptionText = AJS.I18n.getText('bitbucket.web.admin.db.database.description');
        }
        $label.text(labelText).append($labelChildren);
        $description.text(descriptionText);
    }

    function fillDefaultsInFields(oldDbType, newDbType) {
        var defaults = newDbType.defaults;
        _.forEach(oldDbType.defaults, function (defaultValue, fieldName) {
            var $field = $('#' + fieldName);
            var val = $field.val();
            if (val === defaultValue) {
                $field.val(defaults[fieldName] || '');
            }
        });
    }

    exports.onReady = function (dbTypes) {
        var $typeField = $("#type");
        var dbTypeByKey = {};
        _.forEach(dbTypes, function (dbType) {
            dbTypeByKey[dbType.key] = dbType;
        });
        var selectedDbType = dbTypeByKey[$typeField.val()];
        $typeField.on('change', function () {
            var newDbType = dbTypeByKey[$(this).val()];
            toggleDatabaseLabel(newDbType);
            fillDefaultsInFields(selectedDbType, newDbType);
            updateDatabaseMessages(newDbType);
            selectedDbType = newDbType;
        });
    };
});