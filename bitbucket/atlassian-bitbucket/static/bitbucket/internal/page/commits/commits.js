'use strict';

define('bitbucket/internal/page/commits', ['bitbucket/util/navbuilder', 'bitbucket/internal/feature/commits/commits-table', 'bitbucket/internal/model/revision-reference', 'bitbucket/internal/util/events', 'bitbucket/internal/util/history', 'exports'], function (nav, CommitsTable, RevisionReference, events, history, exports) {
    var atRevisionRef;
    var commitsTable;

    function getCommitsUrlBuilder(atRevRef) {
        atRevRef = atRevRef || atRevisionRef;
        var builder = nav.currentRepo().commits();
        if (!atRevRef.isDefault()) {
            builder = builder.withParams({ until: atRevRef.getId() });
        }
        return builder;
    }

    function bindKeyboardShortcuts() {
        commitsTable.bindKeyboardShortcuts();

        events.on('bitbucket.internal.widget.keyboard-shortcuts.register-contexts', function (keyboardShortcuts) {
            keyboardShortcuts.enableContext('commits');
        });

        var disableOpenHandler = function disableOpenHandler() {
            events.trigger('bitbucket.internal.keyboard.shortcuts.disableOpenItemHandler');
        };
        var enableOpenHandler = function enableOpenHandler() {
            events.trigger('bitbucket.internal.keyboard.shortcuts.enableOpenItemHandler');
        };
        events.on('bitbucket.internal.widget.branchselector.dialogShown', disableOpenHandler);
        events.on('bitbucket.internal.widget.branchselector.dialogHidden', enableOpenHandler);
        events.on('bitbucket.internal.layout.branch.actions.dropdownShown', disableOpenHandler);
        events.on('bitbucket.internal.layout.branch.actions.dropdownHidden', enableOpenHandler);
    }

    exports.onReady = function (atRevisionRefJSON) {
        atRevisionRef = new RevisionReference(atRevisionRefJSON);
        commitsTable = new CommitsTable(getCommitsUrlBuilder);
        commitsTable.init();

        events.on('bitbucket.internal.layout.branch.revisionRefChanged', function (newAtRevisionRef) {
            if (atRevisionRef !== newAtRevisionRef) {
                history.pushState(newAtRevisionRef.toJSON(), null, getCommitsUrlBuilder(newAtRevisionRef).build());
            }
        });

        events.on('bitbucket.internal.history.changestate', function (e) {
            var state = e.state;
            if (state) {
                atRevisionRef = new RevisionReference(state);
                commitsTable.update();
                events.trigger("bitbucket.internal.page.commits.revisionRefChanged", null, atRevisionRef);
            }
        });

        bindKeyboardShortcuts();

        history.initialState(atRevisionRef.toJSON());
    };
});