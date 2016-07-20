'use strict';

define('bitbucket/internal/feature/discussion/participants-list', ['aui', 'lodash'], function (AJS, _) {

    function ParticipantsList(participants, $list, $container) {
        this.$list = $list;
        this.$container = $container;
        this.participants = participants;

        _.bindAll(this, 'addedParticipantHandler', 'approvalHandler');

        participants.on('change:approved', this.approvalHandler);
        participants.on('add', this.addedParticipantHandler);
    }

    ParticipantsList.prototype.addedParticipantHandler = function (participant) {
        this.$list.append("<li>" + bitbucket.internal.widget.avatarList.participantAvatar({
            participant: participant.toJSON(),
            extraClasses: 'participant-item',
            withName: true
        }) + "</li>");

        var $count = this.$container.find('.count');
        if ($count.length) {
            var count = parseInt($count.text(), 10);

            if (count === 1) {
                // Pluralise label
                var $label = this.$container.find('.label');
                $label.text(AJS.I18n.getText('bitbucket.web.discussion.participants.label.plural'));
            }

            $count.text(++count);
        } else {
            this.$container.find('.participants-trigger').prepend(bitbucket.internal.feature.discussion.participantCount({ count: 1 }));
        }

        this.$container.removeClass('hidden');
    };

    ParticipantsList.prototype.approvalHandler = function (participant) {
        var $avatars = this.$list.find(".user-avatar[data-username='" + participant.getUser().getName() + "']");
        $avatars.toggleClass("badge-hidden", !participant.getApproved());
    };

    ParticipantsList.prototype.destroy = function () {
        this.participants.off('add', this.addedParticipantHandler);
        this.participants.off('change:approved', this.approvalHandler);
    };

    return ParticipantsList;
});