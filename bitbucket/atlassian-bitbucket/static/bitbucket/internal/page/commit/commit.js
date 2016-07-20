'use strict';

define('bitbucket/internal/page/commit/commit', ['aui', 'aui/flag', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/comments', 'bitbucket/internal/feature/commit/tree-and-diff-view', 'bitbucket/internal/feature/discussion/participants-list', 'bitbucket/internal/feature/watch', 'bitbucket/internal/layout/page-scrolling-manager', 'bitbucket/internal/model/commit-range', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/participant', 'bitbucket/internal/model/participant-collection', 'bitbucket/internal/model/revision', 'bitbucket/internal/model/stash-user', 'bitbucket/internal/util/events', 'bitbucket/internal/util/history', 'exports'], function (AJS, auiFlag, $, _, nav, comments, treeAndDiffView, ParticipantsList, Watch, pageScrollingManager, CommitRange, pageState, Participant, Participants, Revision, StashUser, events, history, exports) {
    var ROOT = "ROOT";

    // state data
    var atRevision;
    var parentRevisions;
    var parentRevisionsById;
    var currentParentRevision;

    //DOM elements
    var $diffToTrigger;
    var $diffToParentOptions;

    function updateParentSelector(selectedParentRevision) {
        $diffToParentOptions.each(function () {
            var $this = $(this);
            var $thisLink = $this.find('a');
            var isSelected = $thisLink.attr('data-id') === selectedParentRevision.getId();

            $this.toggleClass('selected', isSelected);

            if (isSelected) {
                $diffToTrigger.text($this.find('.commitid').text());
            }
        });
    }

    function initForParentId(parentId) {
        currentParentRevision = Object.prototype.hasOwnProperty.call(parentRevisionsById, parentId) ? parentRevisionsById[parentId] : parentRevisions[0];

        updateParentSelector(currentParentRevision);
    }

    function pushState(newParentId) {
        var newUrl = nav.currentRepo().commit(atRevision.getId()).withParams({ to: newParentId }).build();

        history.pushState(null, null, newUrl);
    }

    function getParentIdFromUrl(parents) {
        return nav.parse(window.location.href).getQueryParamValue('to') || parents.length && parents[0].getId() || ROOT;
    }

    function onStateChange() {
        var parentId = getParentIdFromUrl(parentRevisions);

        var parentIdChanged = parentId && parentId !== currentParentRevision.getId();

        if (parentIdChanged) {
            events.stop();
            // don't propagate the event down to treeAndDiffView, otherwise it will first (incorrectly) make a request for the diff of the current file at the new parent,
            // which is discarded as it is immediately followed by the correct request (diff for first file in the tree at the new revision)
            initForParentId(parentId);
            treeAndDiffView.updateCommitRange(new CommitRange({
                untilRevision: atRevision,
                sinceRevision: currentParentRevision
            }));
        }
    }

    function listenForKeyboardShortcutRequests() {
        events.on('bitbucket.internal.widget.keyboard-shortcuts.register-contexts', function (keyboardShortcuts) {
            keyboardShortcuts.enableContext('commit');
            keyboardShortcuts.enableContext('diff-tree');
            keyboardShortcuts.enableContext('diff-view');
        });

        events.on('bitbucket.internal.keyboard.shortcuts.requestReturnToCommits', function (keys) {
            (this.execute ? this : AJS.whenIType(keys)).execute(function () {
                window.location.href = $('#repository-nav-commits').attr('href'); //Make sure we include the sticky branch if there is one
            });
        });
    }

    function initWatching() {
        var commit = pageState.getCommit();
        var commitWatchRestUrl = nav.rest().currentRepo().commit(commit.getId()).watch().build();
        var $watch = $('.watch a');
        var watch = new Watch($watch, commitWatchRestUrl, Watch.type.COMMIT);

        pageState.getCommitParticipants().on('add', function (participant) {
            var currentUser = pageState.getCurrentUser();
            if (currentUser && currentUser.getName() === participant.getUser().getName()) {
                watch.setIsWatching(true);
            }
        });
    }

    function initParticipantsList(participants) {
        events.on('bitbucket.internal.feature.comments.commentAdded', function (comment) {
            var commentUser = new StashUser(comment.author);
            if (commentUser.getEmailAddress() !== pageState.getCommit().getAuthor().emailAddress && !participants.findByUser(commentUser)) {
                participants.add(new Participant({
                    user: commentUser
                }));
            }
        });

        new ParticipantsList(participants, $('.participants-dropdown ul'), $('.participants.plugin-item'));
    }

    exports.onReady = function (jsonRevision, jsonParentRevisions, maxChanges, relevantContextLines, extrasSelector, repository, commit, participantsJSON, unwatched, hasRepoWrite) {
        var participants = new Participants(_.reject(participantsJSON, function (participant) {
            // Filter out the commit author as a participant by email
            return participant.user.emailAddress === commit.author.emailAddress;
        }));
        pageState.extend('isWatching');
        pageState.extend('commitParticipants');
        pageState.setCommitParticipants(participants);

        var isWatchingPromise = $.Deferred();
        _PageDataPlugin.ready('com.atlassian.bitbucket.server.bitbucket-web:iswatching-provider', 'bitbucket.page.commit', function (data) {
            pageState.setIsWatching(data.isWatching);
            isWatchingPromise.resolve(data.isWatching);
        });

        atRevision = new Revision(jsonRevision);
        pageState.setRevisionRef(atRevision.getRevisionReference());
        pageState.setCommit(atRevision);
        parentRevisions = _.map(jsonParentRevisions, function (revisionJson) {
            return new Revision(revisionJson);
        });

        parentRevisionsById = {};

        if (parentRevisions.length) {
            var i;
            var l = parentRevisions.length;
            var parent;
            for (i = 0; i < l; i++) {
                parent = parentRevisions[i];
                parentRevisionsById[parent.getId()] = parent;
            }
        } else {
            parentRevisionsById[ROOT] = new Revision({ id: ROOT });
        }

        // The web-item plugin point in the diff tree header has been deprecated, so the existing web items need to be
        // added on the client side. The deprecated items are added to the treeAndDiffView template and this code
        // renders the tree and diff view on the client.
        $('.aui-page-panel-content').append(bitbucket.internal.feature.treeAndDiffView({}));

        // There may be more than one commitid element (commit parent(s), dropdown for toggling the parent to diff to)
        // so we need quite a specific selector to add the tooltip to.
        var commitIdLink = $('.commit-metadata-details .commit-badge-oneline .commitid');

        commitIdLink.tooltip({
            title: 'data-commitid',
            className: 'commitid-tooltip'
        });

        var $diffToToolbar = $('.commit-metadata-diff-to');

        $diffToParentOptions = $diffToToolbar.find('.aui-dropdown2 .commit-list-item');

        $diffToTrigger = $diffToToolbar.find('.aui-dropdown2-trigger');

        $diffToParentOptions.click(function (e) {
            e.preventDefault();

            var $newParent = $(this);
            var newParentId = $newParent.find('a').attr('data-id');
            $diffToParentOptions.removeClass('selected');

            $newParent.addClass('selected');
            if (newParentId !== currentParentRevision.getId()) {
                pushState(newParentId);
                $(this).closest('.aui-dropdown2')[0].hide();
            }
        });

        // history fires a changestate event when the hash changes for browsers that support pushState...
        events.on('bitbucket.internal.history.changestate', onStateChange);

        pageScrollingManager.acceptScrollForwardingRequests();

        initForParentId(getParentIdFromUrl(parentRevisions));

        treeAndDiffView.init(new CommitRange({
            untilRevision: atRevision,
            sinceRevision: currentParentRevision
        }), {
            maxChanges: maxChanges,
            relevantContextLines: relevantContextLines,
            numberOfParents: parentRevisions.length,
            toolbarWebFragmentLocationPrimary: 'bitbucket.commit.diff.toolbar.primary',
            toolbarWebFragmentLocationSecondary: 'bitbucket.commit.diff.toolbar.secondary',
            commentMode: pageState.getCurrentUser() ? comments.commentMode.CREATE_NEW : comments.commentMode.NONE,
            diffUrlBuilder: function diffUrlBuilder(fileChange) {
                return nav.rest().currentRepo().commit(fileChange.commitRange).diff(fileChange);
            }
        });

        listenForKeyboardShortcutRequests();

        $(extrasSelector + ' .plugin-section-primary').append(bitbucket.internal.page.commitRelatedEntityWebPanels({
            repository: repository,
            commit: commit,
            hasRepoWrite: hasRepoWrite
        }));

        if (pageState.getCurrentUser()) {
            initParticipantsList(participants);
            isWatchingPromise.done(initWatching); // has to be done after the primary plugin section has been rendered
        }

        if (unwatched) {
            auiFlag({
                type: 'success',
                title: AJS.I18n.getText('bitbucket.web.commit.unwatched.header', pageState.getCommit().getDisplayId()),
                close: 'auto',
                body: AJS.I18n.getText('bitbucket.web.commit.unwatched.content')
            });
        }
    };
});