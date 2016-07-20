'use strict';

define('bitbucket/internal/model/pull-request', ['backbone-brace', 'bitbucket/internal/model/participant', 'bitbucket/internal/model/participant-collection', 'bitbucket/internal/model/revision-reference'], function (Brace, Participant, Participants, RevisionReference) {

    'use strict';

    return Brace.Model.extend({
        namedAttributes: {
            'id': null,
            'link': null,
            'links': Object,
            /**
             * The fromRef is a Ref to the source/from branch. This is the "until"/"new" side of any diff.
             */
            'fromRef': RevisionReference,
            /**
             * The toRef is a Ref to the target/to branch. This is the "since"/"old" side of any diff.
             */
            'toRef': RevisionReference,
            'author': Participant,
            'reviewers': Participants,
            'participants': Participants,
            'state': null,
            'open': 'boolean',
            'closed': 'boolean',
            'locked': 'boolean',
            'title': null,
            'createdDate': Date,
            'updatedDate': Date,
            'version': null,
            'description': null,
            'descriptionAsHtml': null,
            // attributes has been deprecated for removal in 4.0
            'attributes': null,
            'properties': null
        },
        addParticipant: function addParticipant(participant) {
            var exists = this.getParticipants().findByUser(participant.getUser());

            if (!exists) {
                this.getParticipants().add(participant);
            }
        }
    }, {
        state: {
            OPEN: "OPEN",
            MERGED: "MERGED",
            DECLINED: "DECLINED"
        }
    });
});