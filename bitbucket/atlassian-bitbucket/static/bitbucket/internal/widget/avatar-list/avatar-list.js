'use strict';

define('bitbucket/internal/widget/avatar-list', ['jquery', 'lodash', 'bitbucket/internal/widget/overflowing-list'], function ($, _, OverflowingList) {

    'use strict';

    function AvatarList(listSelector, participantCollection, options) {
        AvatarList.init();

        options = $.extend({}, AvatarList.defaults, options);

        this._$list = $(listSelector);

        options.getItemHtml = options.getAvatarHtml;
        this._overflowingList = new OverflowingList(this._$list, participantCollection, options);

        var self = this;

        var approvalHandler = function approvalHandler(participant) {
            var $avatars = self._$list.find(".user-avatar[data-username='" + participant.getUser().getName() + "']");
            $avatars.toggleClass("badge-hidden", !participant.getApproved());
        };

        participantCollection.on('change:approved', approvalHandler);
    }
    AvatarList.defaults = {
        itemSelector: '.participant-item',
        overflowMenuClass: 'aui-style-default aui-dropdown2-tailed avatar-dropdown',
        getAvatarHtml: function getAvatarHtml(participant, isOverflowed) {
            return bitbucket.internal.widget.avatarList.participantAvatar({
                participant: participant.toJSON(),
                extraClasses: 'participant-item',
                withName: isOverflowed
            });
        }
    };

    AvatarList.prototype.contains = function (username) {
        return _.any(this._overflowingList._items, function (participant) {
            return participant.getUser().getName() === username;
        });
    };

    AvatarList.prototype.addAvatar = function (avatarData) {
        this._overflowingList.addItem(avatarData);
    };

    AvatarList.init = function () {
        $(".avatar-tooltip > .aui-avatar-inner > img").tooltip({
            hoverable: false,
            offset: 5,
            gravity: function gravity() {
                // Always position on screen
                return $.fn.tipsy.autoNS.call(this) + $.fn.tipsy.autoWE.call(this);
            },
            delayIn: 0,
            live: true
        });

        AvatarList.init = $.noop;
    };

    return AvatarList;
});