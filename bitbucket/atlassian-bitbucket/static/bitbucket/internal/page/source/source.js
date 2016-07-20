'use strict';

define('bitbucket/internal/page/source', ['aui', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/feature/commit/commit-badge', 'bitbucket/internal/feature/file-content', 'bitbucket/internal/layout/page-scrolling-manager', 'bitbucket/internal/model/commit-range', 'bitbucket/internal/model/file-change', 'bitbucket/internal/model/file-change-types', 'bitbucket/internal/model/file-content-modes', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/path', 'bitbucket/internal/model/revision', 'bitbucket/internal/model/revision-reference', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/events', 'bitbucket/internal/util/function', 'bitbucket/internal/util/history', 'exports'], function (AJS, $, _, nav, commitBadge, FileContent, pageScrollingManager, CommitRange, FileChange, FileChangeType, FileContentModes, pageState, Path, Revision, RevisionReference, ajax, events, fn, history, exports) {

    var followRenames;
    var relevantContextLines;
    var dialogIsShowing;
    var currentUrl;
    var state;
    var fileContent;
    var pendingRequest = null;

    function hydrateState(state) {
        return {
            mode: state.mode ? state.mode : FileContentModes.SOURCE,
            path: new Path(state.path),
            headRef: new RevisionReference(state.headRef),
            untilRevision: state.untilRevision ? new Revision(state.untilRevision) : null,
            untilPath: state.untilPath ? new Path(state.untilPath) : null,
            sincePath: state.sincePath ? new Path(state.sincePath) : null,
            autoSincePath: state.autoSincePath || false,
            explicitUntil: state.explicitUntil
        };
    }

    function dehydrateState(state) {
        return {
            mode: state.mode,
            path: state.path.toString(),
            headRef: state.headRef.toJSON(),
            untilRevision: state.untilRevision ? state.untilRevision.toJSON() : null,
            untilPath: state.untilPath ? state.untilPath.toJSON() : null,
            sincePath: state.sincePath ? state.sincePath.toJSON() : null,
            autoSincePath: state.autoSincePath,
            explicitUntil: state.explicitUntil
        };
    }

    function handleBrowserHashChangeEdgeCase() {
        // this should just be a hash change, so it should be ignorable.
        // however, browsers don't always persist state data
        // see: https://github.com/balupton/history.js/wiki/The-State-of-the-HTML5-History-API
        // "State persisted when navigated away and back"
        // in that case, we have to either regrab all the state (path from url, headRef and untilRevision from ??)
        // or reload the page. Reloading the page because it's the easier option.

        var isHashChangeOnly = _.endsWith(urlWithoutHash(window.location.href), urlWithoutHash(currentUrl));

        if (!isHashChangeOnly) {
            window.location.reload();
        }
    }

    function getCurrentCommitRange() {
        // If they didn't explicitly choose to see the until revision (and instead the until revision just
        // contains the latest change to this file), then show them the source at HEAD, instead of at the latest
        // change. The latest change might be before a merge commit, and therefore not necessarily have the same
        // content as what is at HEAD.
        var untilRevision = state.mode === FileContentModes.DIFF || state.explicitUntil ? state.untilRevision : new Revision({
            id: state.headRef.getId(),
            displayId: state.headRef.getDisplayId(),
            author: { "name": "Unknown" },
            authorTimestamp: NaN,
            parents: [],
            properties: {
                change: {
                    srcPath: null
                }
            }
        });
        return new CommitRange({
            untilRevision: untilRevision,
            sinceRevision: untilRevision.hasParents() ? untilRevision.getParents()[0] : undefined
        });
    }

    function urlWithoutHash(url) {
        var hashIndex = url.lastIndexOf('#');
        return hashIndex === -1 ? url : url.substring(0, hashIndex);
    }

    function updateForState() {

        // if we're still updating from a previous request, abort that update.
        if (pendingRequest) {
            pendingRequest.abort();
            pendingRequest = null;
        }

        if (!state.untilRevision || state.autoSincePath && state.mode === FileContentModes.DIFF) {
            // either we changed the branch selector, and so we don't actually know the until commit
            // OR we know the until commit, but we've deferred loading of the srcPath, and need to load it now

            fileContent.reset(); // Destroy the last view

            if (!state.untilRevision) {
                pendingRequest = getLatestFileRevision(state.path, state.headRef);
                pendingRequest.done(function (revision) {
                    state.untilRevision = revision;
                });
            } else {
                pendingRequest = getLatestFileRevision(state.untilPath, state.untilRevision.getRevisionReference());
            }

            pendingRequest.always(function () {
                pendingRequest = null;
            }).done(function (revision) {
                state.autoSincePath = false;
                var srcPath = revision && revision.getProperties() && revision.getProperties().change.srcPath;
                state.sincePath = srcPath ? new Path(srcPath) : null;
                updateForState();
            });
        } else {
            initFileContent();
            updateCommitBadge(state.untilRevision);
        }
    }

    function initFileContent() {
        var headPathString = state.path.toString();
        var untilPathString = state.untilPath.toString();
        var sincePathString = state.sincePath && state.sincePath.toString();
        var viewingARename = Boolean(state.mode === FileContentModes.DIFF && sincePathString && untilPathString !== sincePathString);

        var defaults = {
            toolbarWebFragmentLocationPrimary: 'bitbucket.file-content.' + state.mode + '.toolbar.primary',
            toolbarWebFragmentLocationSecondary: 'bitbucket.file-content.' + state.mode + '.toolbar.secondary',
            followRenames: followRenames,
            autoSrcPath: state.autoSincePath
        };
        var overrides = {
            anchor: window.location.hash.substr(1) || undefined,
            headPath: state.path,
            headRef: state.headRef,
            relevantContextLines: relevantContextLines,
            breadcrumbs: headPathString !== untilPathString || undefined,
            changeTypeLozenge: viewingARename || undefined
        };

        var options = $.extend(defaults, FileContent[state.mode + 'Preset'], overrides);

        var fileChangeType;
        if (viewingARename) {
            fileChangeType = state.untilPath.isSameDirectory(state.sincePath) ? FileChangeType.RENAME : FileChangeType.MOVE;
        }

        var fileChange = new FileChange({
            commitRange: getCurrentCommitRange(),
            path: state.untilPath,
            repository: pageState.getRepository(),
            srcPath: state.sincePath,
            type: fileChangeType
        });

        return fileContent.init(fileChange, options);
    }

    function updateCommitBadge(untilRevision) {
        $('.branch-selector-toolbar .commit-badge-container').empty().append(commitBadge.create(untilRevision.toJSON(), pageState.getRepository().toJSON())).fadeIn('fast');
    }

    function pushState(newState) {
        var urlBuilder = nav.currentRepo();
        if (newState.mode === FileContentModes.DIFF) {
            var fileChange = new FileChange({
                commitRange: new CommitRange({
                    untilRevision: newState.untilRevision // Since is the revision's parent but not needed in the URL
                }),
                path: newState.untilPath,
                srcPath: newState.sincePath,
                repository: pageState.getRepository()
            });
            urlBuilder = urlBuilder.diff(fileChange, newState.headRef, newState.path);
        } else {
            urlBuilder = urlBuilder.browse().path(newState.path);
            if (newState.untilRevision) {
                urlBuilder = urlBuilder.until(newState.untilRevision.getId(), newState.untilPath);
            }

            if (!newState.headRef.isDefault()) {
                urlBuilder = urlBuilder.at(newState.headRef.getId());
            }
        }
        history.pushState(dehydrateState(newState), null, urlBuilder.build());
    }

    function getLatestFileRevision(path, revisionReference) {
        function fallback() {
            //HACK: this is used when the revision doesn't exist on the branch you select.
            // We should handle it differently, but probably never will.

            return {
                id: revisionReference.getLatestCommit(),
                displayId: revisionReference.getDisplayId(),
                author: { "name": "Unknown" },
                authorTimestamp: NaN,
                parents: [],
                properties: {
                    change: {
                        srcPath: null
                    }
                }
            };
        }

        var fileHistoryUrlBuilder = nav.rest().currentRepo().commits().withParams({
            avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'xsmall' }),
            followRenames: true,
            limit: 1,
            path: path.toString(),
            until: revisionReference.getLatestCommit()
        });

        var xhr = ajax.rest({
            url: fileHistoryUrlBuilder.build()
        });

        var pipedPromise = xhr.then(function (commits) {
            if (commits.values[0]) {
                return new Revision(commits.values[0]);
            } else {
                // BSERV-8673 If there is no data the file must have been created in a merge
                // so do the REST call again with followRenames: false so merge commits are included
                return ajax.rest({
                    url: fileHistoryUrlBuilder.withParams({
                        followRenames: false
                    }).build()
                }).then(function (commits) {
                    return new Revision(commits.values[0] || fallback());
                });
            }
        });

        events.trigger('bitbucket.internal.page.source.requestedRevisionData');
        return pipedPromise.promise(xhr);
    }

    exports.onReady = function (path, atRevisionRef, untilRevision, untilPath, mode, fileContentContainerSelector, fileContentId, _relevantContextLines, _followRenames, autoSincePath, sincePath) {

        pageScrollingManager.acceptScrollForwardingRequests();

        followRenames = _followRenames;
        relevantContextLines = _relevantContextLines;
        currentUrl = window.location.href;
        state = hydrateState({
            mode: FileContentModes.DIFF === mode ? FileContentModes.DIFF : FileContentModes.SOURCE,
            path: path,
            headRef: atRevisionRef,
            untilRevision: untilRevision,
            untilPath: untilPath,
            sincePath: sincePath,
            autoSincePath: autoSincePath,
            explicitUntil: !!nav.parse(window.location).getQueryParamValue('until')
        });

        fileContent = new FileContent(fileContentContainerSelector, fileContentId, FileContent.sourcePreset);

        events.on('bitbucket.internal.history.changestate', function (e) {
            if (!e.state) {
                return handleBrowserHashChangeEdgeCase();
            }

            var newState = hydrateState(e.state);

            var currentUntilId = state.untilRevision ? state.untilRevision.getId() : null;
            var newUntilId = newState.untilRevision ? newState.untilRevision.getId() : null;

            var headRefChanged = state.headRef.getId() !== newState.headRef.getId();
            var stateChanged = newState.path.toString() !== state.path.toString() || headRefChanged || newUntilId !== currentUntilId || newState.mode !== state.mode || newState.autoSincePath !== state.autoSincePath || newState.explicitUntil !== state.explicitUntil;

            state = newState;

            if (headRefChanged) {
                events.trigger('bitbucket.internal.page.source.revisionRefChanged', null, state.headRef);
            }

            // it's possible this we're just popping a hashchange. Check that state actually changed.
            if (stateChanged) {
                updateForState();
            }
            currentUrl = window.location.href;
        });

        // Trigger a state change to refresh the file currently shown in the diff view.
        // Use case: diff options have changed and a new representation of the file needs to be shown.
        events.on('bitbucket.internal.feature.fileContent.optionsChanged', function (change) {
            var nonRefreshKeys = ['hideComments', 'hideEdiff'];

            if (!_.contains(nonRefreshKeys, change.key)) {
                updateForState();
            }
        });

        events.on('bitbucket.internal.layout.branch.revisionRefChanged', function (revisionReference) {
            if (state.headRef !== revisionReference) {
                // the new commit reference isn't necessarily the commit on which the file was changed.
                // we must find the latest one where it was changed. hence why untilRevision is null
                // Always revert back to source view - doesn't make sense to keep on diff view when switching branches.
                pushState(_.extend({}, state, {
                    headRef: revisionReference,
                    untilRevision: null,
                    mode: FileContentModes.SOURCE,
                    explicitUntil: false
                }));
            }
        });

        events.on('bitbucket.internal.feature.*.untilRevisionChanged', function (revision, path, sincePath) {
            if (!state.explicitUntil || state.untilRevision.getId() !== revision.getId()) {
                pushState(_.extend({}, state, {
                    untilRevision: revision,
                    untilPath: path,
                    sincePath: sincePath,
                    autoSincePath: false,
                    explicitUntil: true
                }));
            }
        });

        events.on('bitbucket.internal.feature.*.requestedModeChange', function (mode) {
            if (state.mode !== mode) {
                pushState(_.extend({}, state, {
                    mode: mode
                }));
            }
        });

        events.on('bitbucket.internal.feature.sourceview.onError', function (errors) {
            $('.branch-selector-toolbar .commit-badge-container').fadeOut('fast');
        });

        events.on('bitbucket.internal.layout.*.urlChanged', function (url) {
            window.location = url;
            //TODO: pushState back to fileBrowser
            //events.trigger('bitbucket.internal.page.source.urlChanged', null, url);
        });
        events.on('bitbucket.internal.feature.*.urlChanged', function (url) {
            window.location = url;
            //TODO: pushState back to fileBrowser
            //events.trigger('bitbucket.internal.page.source.urlChanged', null, url);
        });

        events.on('bitbucket.internal.widget.branchselector.dialogShown', function () {
            dialogIsShowing = true;
        });
        events.on('bitbucket.internal.widget.branchselector.dialogHidden', function () {
            dialogIsShowing = false;
        });

        $(window).on('hashchange', function () {
            currentUrl = window.location.href;

            history.replaceState(dehydrateState(state), null, currentUrl);

            var anchor = window.location.hash.substr(1) || undefined;

            //Quack quack
            fn.dotX('handler.updateAnchor', anchor)(fileContent);

            events.trigger('bitbucket.internal.page.source.anchorChanged', null, anchor);
        });

        events.on('bitbucket.internal.widget.keyboard-shortcuts.register-contexts', function (keyboardShortcuts) {
            keyboardShortcuts.enableContext('sourceview');
            keyboardShortcuts.enableContext('diff-view');
        });

        events.on('bitbucket.internal.keyboard.shortcuts.requestOpenParentHandler', function (keys) {
            (this.execute ? this : AJS.whenIType(keys)).execute(function () {
                if (!dialogIsShowing) {
                    var $parentDir = $('.breadcrumbs').find('a:last');
                    if ($parentDir.length) {
                        $parentDir.click();
                    }
                }
            });
        });

        // These functions are here to support the editor plugin.
        // TODO remove when implementing an editor in core.
        exports.pause = function () {
            fileContent.reset();
        };
        exports.resume = function () {
            updateForState();
        };

        history.initialState(dehydrateState(state));

        updateForState();
    };
});