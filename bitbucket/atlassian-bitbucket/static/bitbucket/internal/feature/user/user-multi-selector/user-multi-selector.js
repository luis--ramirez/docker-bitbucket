'use strict';

define('bitbucket/internal/feature/user/user-multi-selector', ['aui', 'jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/widget/searchable-multi-selector'], function (AJS, $, nav, SearchableMultiSelector) {

    function UserMultiSelector($field, options) {
        SearchableMultiSelector.call(this, $field, options);
    }

    $.extend(true, UserMultiSelector.prototype, SearchableMultiSelector.prototype, {
        defaults: {
            hasAvatar: true,
            url: nav.rest().users().build(),
            selectionTemplate: function selectionTemplate(person) {
                return bitbucket.internal.widget.avatarWithName({
                    size: 'xsmall',
                    person: person
                });
            },
            urlParams: {
                avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'xsmall' })
            },
            resultTemplate: function resultTemplate(person) {
                return bitbucket.internal.widget.avatarWithNameAndEmail({
                    size: 'small',
                    person: person
                });
            },
            generateId: function generateId(user) {
                // We only use the name as we may not have access to the id
                return user.name;
            },
            inputTooShortTemplate: function defaultInputTooShortTemplate() {
                return AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.user.multi.selector.help'));
            },
            noMatchesTemplate: function defaultNoMatchesTemplate() {
                return AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.user.multi.selector.no.match'));
            },
            prepareSearchTerm: function prepareSearchTerm(term) {
                // Don't be picky when user types in "@user" instead of "user"
                return term.replace(/^@/, "");
            }
        }
    });

    return UserMultiSelector;
});