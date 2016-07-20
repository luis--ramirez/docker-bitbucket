'use strict';

define('bitbucket/internal/model/conflict', ['aui', 'backbone-brace', 'bitbucket/internal/model/conflict-change', 'bitbucket/internal/model/file-change-types'], function (AJS, Brace, ConflictChange, ChangeType) {

    'use strict';

    var messageMatrix = {};

    messageMatrix[ChangeType.ADD] = {};
    messageMatrix[ChangeType.ADD][ChangeType.ADD] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.add.add');
    messageMatrix[ChangeType.ADD][ChangeType.RENAME] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.add.rename');
    messageMatrix[ChangeType.ADD][ChangeType.MOVE] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.add.move');

    messageMatrix[ChangeType.MODIFY] = {};
    messageMatrix[ChangeType.MODIFY][ChangeType.MODIFY] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.modify.modify');
    messageMatrix[ChangeType.MODIFY][ChangeType.RENAME] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.modify.rename');
    messageMatrix[ChangeType.MODIFY][ChangeType.MOVE] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.modify.move');
    messageMatrix[ChangeType.MODIFY][ChangeType.DELETE] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.modify.delete');

    messageMatrix[ChangeType.RENAME] = {};
    messageMatrix[ChangeType.RENAME][ChangeType.ADD] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.rename.add');
    messageMatrix[ChangeType.RENAME][ChangeType.RENAME] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.rename.rename');
    messageMatrix[ChangeType.RENAME][ChangeType.MOVE] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.rename.move');
    messageMatrix[ChangeType.RENAME][ChangeType.DELETE] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.rename.delete');

    messageMatrix[ChangeType.MOVE] = {};
    messageMatrix[ChangeType.MOVE][ChangeType.ADD] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.move.add');
    messageMatrix[ChangeType.MOVE][ChangeType.RENAME] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.move.rename');
    messageMatrix[ChangeType.MOVE][ChangeType.MOVE] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.move.move');
    messageMatrix[ChangeType.MOVE][ChangeType.DELETE] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.move.delete');

    messageMatrix[ChangeType.DELETE] = {};
    messageMatrix[ChangeType.DELETE][ChangeType.MODIFY] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.delete.modify');
    messageMatrix[ChangeType.DELETE][ChangeType.RENAME] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.delete.rename');
    messageMatrix[ChangeType.DELETE][ChangeType.MOVE] = AJS.I18n.getText('bitbucket.web.pullrequest.diff.conflict.title.delete.move');

    var Conflict = Brace.Model.extend({
        namedAttributes: {
            'ourChange': ConflictChange,
            'theirChange': ConflictChange
        },
        getConflictMessage: function getConflictMessage() {
            //'our' describes the change that was made on the destination branch relative to a shared
            //ancestor with the incoming branch.
            //'their' describes the change that was made on the incoming branch relative to a shared
            //ancestor with the destination branch
            var destinationModState = this.getOurChange() && this.getOurChange().getType();
            var incomingModState = this.getTheirChange() && this.getTheirChange().getType();

            return messageMatrix[incomingModState] && messageMatrix[incomingModState][destinationModState] || '';
        }
    });

    return Conflict;
});