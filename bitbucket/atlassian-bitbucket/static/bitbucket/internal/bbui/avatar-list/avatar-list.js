define('bitbucket/internal/bbui/avatar-list/avatar-list', ['exports', 'jquery'], function (exports, _jquery) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.updateApproval = updateApproval;
    exports.sortParticipants = sortParticipants;

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var approvalOrder = {
        APPROVED: 1,
        NEEDS_WORK: 2,
        UNAPPROVED: 3
    };

    var currentUser = void 0;

    function updateApproval(listEl, participant) {
        var $avatars = (0, _jquery2.default)(listEl).find('.user-avatar[data-username="' + participant.getUser().getName() + '"]');
        $avatars.toggleClass('badge-hidden', !participant.getApproved());
    }

    function sortParticipants(participants) {
        currentUser = currentUser || (0, _jquery2.default)('[data-logged-in-reviewer]').attr('data-logged-in-reviewer');
        var loggedInReviewer = currentUser && JSON.parse(currentUser);
        var loggedInReviewerName = loggedInReviewer && loggedInReviewer.name;

        function compare(a, b) {
            return approvalOrder[a.state] - approvalOrder[b.state] || (a.user.name === loggedInReviewerName ? -1 : 0 || (b.user.name === loggedInReviewerName ? 1 : a.user.display_name.localeCompare(b.user.display_name)));
        }
        return participants.sort(compare);
    }
});