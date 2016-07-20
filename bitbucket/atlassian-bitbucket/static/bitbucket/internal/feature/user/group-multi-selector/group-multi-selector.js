'use strict';

define('bitbucket/internal/feature/user/group-multi-selector', ['aui', 'jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/widget/searchable-multi-selector'], function (AJS, $, nav, SearchableMultiSelector) {

    function getGroupName(groupOrGroupName) {
        return typeof groupOrGroupName === 'string' ? groupOrGroupName : groupOrGroupName.name;
    }

    function GroupMultiSelector($field, options) {
        SearchableMultiSelector.call(this, $field, options);
    }

    $.extend(true, GroupMultiSelector.prototype, SearchableMultiSelector.prototype, {
        defaults: {
            hasAvatar: true,
            url: nav.rest().groups().build(),
            selectionTemplate: function selectionTemplate(group) {
                return bitbucket.internal.widget.groupAvatarWithName({
                    size: 'xsmall',
                    name: getGroupName(group)
                });
            },
            resultTemplate: function resultTemplate(group) {
                return bitbucket.internal.widget.groupAvatarWithName({
                    size: 'small',
                    name: getGroupName(group)
                });
            },
            generateId: getGroupName,
            generateText: getGroupName,
            inputTooShortTemplate: function defaultInputTooShortTemplate() {
                return AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.group.multi.selector.help'));
            },
            noMatchesTemplate: function defaultNoMatchesTemplate() {
                return AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.group.multi.selector.no.match'));
            }
        }
    });

    return GroupMultiSelector;
});