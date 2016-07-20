'use strict';

define('bitbucket/internal/feature/user/group-users-table', ['aui', 'aui/flag', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/user/user-multi-selector', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/function', 'bitbucket/internal/widget/paged-table'], function (AJS, auiFlag, $, _, nav, UserMultiSelector, ajax, fn, PagedTable) {

    'use strict';

    var addPickerSelector = '.users-multi-selector';
    var addButtonSelector = '.add-button';
    var deleteButtonsSelector = '.delete-button';

    /**
     * Table holding the users in a group.
     *
     * @param options config options, see PagedTable.defaults for examples
     * @constructor
     */
    function GroupUsersTable(options) {
        PagedTable.call(this, $.extend({
            filterable: false,
            noneFoundMessageHtml: AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.user.group.members.none')),
            idForEntity: fn.dot('name'), // 'name' is used instead of 'id' because the REST end points for adding/removing users to a group use 'usernames' as parameters
            paginationContext: 'group-users-table'
        }, options));
        this.group = this.$table.attr('data-group');
        this.$notifications = this.$table.prev('.notifications');
        this._initBindings = _.once(this._initBindings);
    }

    $.extend(GroupUsersTable.prototype, PagedTable.prototype);

    GroupUsersTable.prototype.init = function () {
        PagedTable.prototype.init.call(this);
        this._initBindings();
    };

    GroupUsersTable.prototype.buildUrl = function (start, limit, filter) {
        var params = {
            context: this.group,
            start: start,
            limit: limit,
            avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'small' })
        };
        return nav.admin().groups().addPathComponents('more-members').withParams(params).build();
    };

    GroupUsersTable.prototype.handleNewRows = function (userPage, attachmentMethod) {
        this.$table.find('tbody')[attachmentMethod](bitbucket.internal.feature.user.groupUserRows({
            page: userPage
        }));
    };

    GroupUsersTable.prototype.handleErrors = function (errors) {
        var $notifications = this.$notifications.empty();
        _.each(errors, function (error) {
            $notifications.append(aui.message.error({ content: AJS.escapeHtml(error.message) }));
        });
    };

    GroupUsersTable.prototype.remove = function (user) {
        var self = this;
        if (PagedTable.prototype.remove.call(this, user)) {
            var $row = this.$table.find('tbody > tr[data-name]').filter(function () {
                return $(this).attr('data-name') === user.name;
            });
            $row.fadeOut('fast', function () {
                $row.remove();
                self.updateTimestamp();
            });
        }
    };

    GroupUsersTable.prototype._initBindings = function () {
        var self = this;
        var usersSelector = new UserMultiSelector($(addPickerSelector, self.$table), {
            url: nav.admin().groups().addPathComponents('more-non-members').withParams({
                context: self.group
            }).build()
        });

        self.$table.on('click', addButtonSelector, function (e) {
            e.preventDefault();
            var users = usersSelector.getSelectedItems();
            var usernames = _.pluck(users, 'name');
            self._addUsers(self.group, usernames).done(function () {
                usersSelector.clearSelectedItems();

                auiFlag({
                    type: 'success',
                    close: 'auto',
                    body: bitbucket.internal.feature.permission.flag.added({
                        name: users[0].name,
                        entityType: 'user',
                        count: users.length
                    })
                });

                self.add(_.map(users, function (user) {
                    return $.extend({ justAdded: true }, user);
                }));
            }).fail(function (xhr, textStatus, error, data) {
                self.handleErrors(self._extractErrors(data));
            });
        });

        self.$table.on('click', deleteButtonsSelector, function (e) {
            e.preventDefault();
            var username = $(e.target).closest('a').attr('data-for');
            self._removeUser(self.group, username).done(function () {
                self.remove({ name: username });

                auiFlag({
                    type: 'success',
                    close: 'auto',
                    body: bitbucket.internal.feature.permission.flag.deleted({
                        name: username,
                        entityType: 'user'
                    })
                });
            }).fail(function (xhr, textStatus, error, data) {
                self.handleErrors(self._extractErrors(data));
            });
        });
    };

    GroupUsersTable.prototype._addUsers = function (group, users) {
        return ajax.rest({
            data: {
                group: group,
                users: users
            },
            statusCode: {
                '403': false,
                '404': false,
                '500': false
            },
            type: 'POST',
            url: nav.admin().groups().addPathComponents('add-users').build()
        });
    };

    GroupUsersTable.prototype._removeUser = function (group, username) {
        return ajax.rest({
            data: {
                context: group,
                itemName: username
            },
            statusCode: {
                '403': false,
                '404': false,
                '409': false,
                '500': false
            },
            type: 'POST',
            url: nav.admin().groups().addPathComponents('remove-user').build()
        });
    };

    GroupUsersTable.prototype._extractErrors = function (data) {
        return data && data.errors && data.errors.length ? data.errors : [{
            message: AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.user.group.unknown.error'))
        }];
    };

    return GroupUsersTable;
});