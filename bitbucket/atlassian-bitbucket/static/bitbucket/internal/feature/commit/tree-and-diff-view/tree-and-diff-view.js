'use strict';

define('bitbucket/internal/feature/commit/tree-and-diff-view', ['aui', 'jquery', 'lodash', 'bitbucket/util/state', 'bitbucket/internal/feature/commit/difftree', 'bitbucket/internal/feature/file-content', 'bitbucket/internal/model/conflict', 'bitbucket/internal/model/file-change', 'bitbucket/internal/model/file-content-modes', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/path-and-line', 'bitbucket/internal/util/dom-event', 'bitbucket/internal/util/events', 'bitbucket/internal/util/feature-detect', 'bitbucket/internal/util/shortcuts', 'exports'], function (AJS, $, _, state, difftree, FileContent, Conflict, FileChange, FileContentModes, pageState, PathAndLine, domEvent, events, featureDetect, shortcuts, exports) {
    var DiffTree = difftree.DiffTree;
    var ROOT = 'ROOT';

    var _options;

    //state
    var currentCommitRange;
    var currentFileChange;
    var currentFilePath;
    var currentSearch;
    var changingState = false;
    var _destroyables = [];

    // components/features/widgets
    var currentDiffTree;
    var diffTreesByCommitRangeId = {}; //cache for diff-tree's created for different CommitRanges
    var fileContent;

    // Selectors for resizing commitPanes height and scrollbar & spinner
    var $window = $(window);
    var $footer;
    var $content;
    var $container;
    var $spinner;
    var windowHeight;
    var diffTreeMaxHeight;
    var $commitFileContent;
    var $fileTreeContainer;
    var $fileTreeWrapper;
    var $fileTree;
    var $contentView;
    var $diffViewToolbar; // boolean for determining if the file tree is stalking or not

    function getFileChangeFromNode($node) {
        var path = getPathFromNode($node);
        var srcPath = getSrcPathFromNode($node);
        var changeType = getChangeTypeFromNode($node);
        var nodeType = getNodeTypeFromNode($node);
        var conflict = getConflictFromNode($node);
        var executable = getExecutableFromNode($node);
        var srcExecutable = getSrcExecutableFromNode($node);

        return new FileChange({
            repository: pageState.getRepository(),
            commitRange: currentCommitRange,
            srcPath: srcPath && srcPath.path,
            path: path.path,
            type: changeType,
            nodeType: nodeType,
            line: path.line,
            search: currentSearch,
            conflict: conflict,
            srcExecutable: srcExecutable,
            executable: executable
        });
    }

    function initFileContent($node) {
        return initFileContentFromChange(getFileChangeFromNode($node));
    }

    function initFileContentFromChange(fileChange, anchor) {
        if (!fileContent) {
            fileContent = new FileContent($container, 'commit-file-content');
        }

        if (!anchor) {
            anchor = fileChange.getLine();
        }

        currentFileChange = fileChange;
        currentFilePath = new PathAndLine(fileChange.getPath(), fileChange.getLine());
        pageState.setFilePath(fileChange.getPath());

        $container.height($container.height());
        //temporarily set the height explicitly to the current height to stop the jump when the diffview is removed.
        //cleaned up in onTreeAndDiffViewSizeChanged
        var scrollTop = $window.scrollTop();

        return fileContent.init(fileChange, $.extend(_options, { anchor: anchor })).done(function () {
            $commitFileContent = $('#commit-file-content');
            // Don't continue if we don't have a file-content area to work with
            if ($commitFileContent.length === 0) {
                return;
            }
            $diffViewToolbar = $commitFileContent.find('.file-toolbar');
            $contentView = $commitFileContent.find('.content-view');

            scrollTop = scrollContentToTop(scrollTop);
            $window.scrollTop(scrollTop);
        });
    }

    function destroyFileContent() {
        var deferred = $.Deferred();
        currentFilePath = null;
        currentFileChange = null;

        if (fileContent) {
            fileContent.destroy();
            fileContent = null;
        }

        $('#commit-file-content').remove();

        return deferred.resolve();
    }

    function getPathFromNode($node) {
        return new PathAndLine($node.data('path'));
    }

    function getChangeTypeFromNode($node) {
        return $node.data('changeType');
    }

    function getNodeTypeFromNode($node) {
        return $node.data('nodeType');
    }

    function getSrcPathFromNode($node) {
        return $node.data('srcPath') && new PathAndLine($node.data('srcPath'));
    }

    function getConflictFromNode($node) {
        return $node.data('conflict') && new Conflict($node.data('conflict'));
    }

    function getSrcExecutableFromNode($node) {
        return $node.data('srcExecutable');
    }

    function getExecutableFromNode($node) {
        return $node.data('executable');
    }

    function getDiffTreeMaxHeight() {
        windowHeight = $window.height();
        var diffTreeMaxHeight = windowHeight;
        $('.file-tree-container').children(':not(.file-tree-wrapper)').each(function () {
            diffTreeMaxHeight = diffTreeMaxHeight - $(this).outerHeight(true);
        });
        return diffTreeMaxHeight;
    }

    function onTreeAndDiffViewSizeChanged() {
        diffTreeMaxHeight = getDiffTreeMaxHeight();

        // update diff-tree height
        $fileTreeWrapper.css({ 'max-height': diffTreeMaxHeight + 'px', 'border-bottom-width': 0 });
    }

    function scrollContentToTop(scrollTop) {
        var diffOffset = $commitFileContent.offset();
        if (diffOffset) {
            // Only try to get the offset if we can get it from the element.
            return Math.min(scrollTop, diffOffset.top);
        }
        return scrollTop;
    }

    // Trigger a state change to refresh the file currently shown in the diff view.
    // Use case: diff options have changed and a new representation of the file needs to be shown.
    events.on('bitbucket.internal.feature.fileContent.optionsChanged', function (change) {
        var nonRefreshKeys = ['hideComments', 'hideEdiff'];

        if (!_.contains(nonRefreshKeys, change.key)) {
            initSelectedFileContent();
        }
    });

    // Keep track of the last search to highlight subsequently selected files in the tree
    events.on('bitbucket.internal.feature.diffView.highlightSearch', function (search) {
        currentSearch = search;
    });

    /**
     * Change the state of the view based on whether the selected file is changed and if we have a current diff-tree
     */
    function onStateChange() {
        changingState = true;

        var selectedPath = getPathFromUrl();

        var selectedFileChanged = Boolean(selectedPath) ^ Boolean(currentFilePath) || selectedPath && selectedPath.path.toString() !== currentFilePath.path.toString();

        if (selectedFileChanged && currentDiffTree) {
            currentDiffTree.selectFile(selectedPath.path.getComponents());
            initSelectedFileContent();

            // scroll the diff to the correct line, this will happen after the first change has been highlighted :(
            // TODO stop the first change being highlighted.
            if (selectedPath.line) {
                events.once('bitbucket.internal.feature.fileContent.diffViewContentChanged', function () {
                    events.trigger('bitbucket.internal.feature.diffView.lineChange', null, selectedPath.line);
                });
            }
        } else if (selectedPath.toString() !== currentFilePath.toString()) {
            // TODO Using events like this to trigger a line change is not ideal, we need a better way to pass 'messages'
            //      via the fileContent into the current view.
            // Only if the line number has changed directly
            events.trigger('bitbucket.internal.feature.diffView.lineChange', null, selectedPath.line);
            // Otherwise the first selected line will not 'select' again
            currentFilePath = selectedPath;
        }
        changingState = false;
    }

    /**
     * Reload the diff viewer
     *
     * Used when the file changes or the diff view is changed (unified v side-by-side)
     */
    function initSelectedFileContent() {
        var $node = currentDiffTree.getSelectedFile();

        if ($node && $node.length > 0) {
            initFileContent($node);
        } else if (currentFileChange) {
            // Fallback to the current file change, even if there is no tree node selected
            // This is to handle the case where there are no search results but the previous file is still selected
            initFileContentFromChange(currentFileChange);
        }
    }

    function updateDiffTree(optSelectedPathComponents) {
        if (!$spinner) {
            $spinner = $('<div class="spinner"/>');
        }

        $fileTreeWrapper.siblings('.file-tree-header').replaceWith(bitbucket.internal.feature.fileTreeHeader({
            commit: _options.linkToCommit ? currentCommitRange.getUntilRevision().toJSON() : null,
            repository: state.getRepository()
        }));

        $container.addClass('loading-diff-tree');
        $spinner.appendTo('#content .file-tree-wrapper').spin('large', { zIndex: 10 });
        return currentDiffTree.init(optSelectedPathComponents).always(function () {
            $container.removeClass('loading-diff-tree');
            if ($spinner) {
                $spinner.spinStop().remove();
                $spinner = null;
            }
        }).done(function () {
            $fileTree = $('.file-tree');
            diffTreeMaxHeight = getDiffTreeMaxHeight();

            $fileTreeWrapper.css('max-height', diffTreeMaxHeight);
        });
    }

    function getPathFromUrl() {
        return new PathAndLine(decodeURI(window.location.hash.substring(1)));
    }

    var toggleDiffTree;
    function initDiffTreeToggle() {
        var $toggle = $('.collapse-file-tree');
        var $commitFilesContainer = $('.commit-files');
        var $diffTreeContainer = $('.file-tree-container');
        var collapsed;

        function triggerCollapse() {
            events.trigger('bitbucket.internal.feature.commit.difftree.collapseAnimationFinished', null, collapsed);
        }

        // debounce expanding the diff tree container on hover
        var quickRevealTimer;

        // this will be used to determine if the file browser is triggered manually or programatically
        var isQuickRevealing = false;

        // delay of revealing after hover on the browser (in ms)
        var QUICK_REVEAL_SHOW_DELAY = 200;

        // cancellable debounce, which will be canceled when user's got mouse leave the container
        // *NOTE* When lodash is upgraded to 3.0, we shall revisit here and change to the _.debounce as
        // it will be cancellable in v3.0
        var quickReveal = function quickReveal() {
            clearTimeout(quickRevealTimer);

            // do nothing if it's already expanded
            if (!$commitFilesContainer.hasClass('collapsed')) {
                return;
            }

            quickRevealTimer = setTimeout(function () {
                isQuickRevealing = true;
                _internalToggleDiffTree(false);
            }, QUICK_REVEAL_SHOW_DELAY);
        };

        var exitQuickReveal = function exitQuickReveal() {
            clearTimeout(quickRevealTimer);

            if (isQuickRevealing) {
                isQuickRevealing = false;
                toggleDiffTree(true);
            }
        };

        /**
         *
         * @param forceCollapsed false if you want to force collapse the file browser
         *                      true if you want to force open it
         *                      undefined if you want to toggle it according to the current status
         */
        var _internalToggleDiffTree = function _internalToggleDiffTree(forceCollapsed) {
            var previousCollapsed = $commitFilesContainer.hasClass('collapsed');
            if (typeof forceCollapsed === 'undefined') {
                forceCollapsed = !previousCollapsed;
            }
            $commitFilesContainer.toggleClass('collapsed', forceCollapsed).toggleClass('quick-reveal-mode', isQuickRevealing);

            collapsed = $commitFilesContainer.hasClass('collapsed');

            if (collapsed !== previousCollapsed) {
                events.trigger('bitbucket.internal.feature.commit.difftree.toggleCollapse', null, collapsed);

                if (!featureDetect.cssTransition()) {
                    triggerCollapse();
                }
            }
        };

        toggleDiffTree = function toggleDiffTree(forceCollapsed) {
            // if we are on quick reveal mode, we shall force expanding the file browser anyway.
            forceCollapsed = isQuickRevealing ? false : forceCollapsed;
            if ((typeof forceCollapsed === 'undefined' ? 'undefined' : babelHelpers.typeof(forceCollapsed)) === 'object') {
                forceCollapsed = undefined;
            }
            isQuickRevealing = false;
            clearTimeout(quickRevealTimer);

            _internalToggleDiffTree(forceCollapsed);
        };

        _destroyables.push(events.chainWith($toggle).on('click', domEvent.preventDefault(toggleDiffTree)));
        _destroyables.push(events.chainWith($diffTreeContainer).on('mouseleave', exitQuickReveal).on('transitionend', domEvent.filterByTarget($diffTreeContainer, triggerCollapse)));

        // we shouldn't bind the hovering to the whole container, as the user may want to press the "expand" icon
        _destroyables.push(events.chainWith($diffTreeContainer.find('.file-tree-wrapper, .commit-selector-button')).on('mouseenter', quickReveal));
        _destroyables.push(events.chainWith($diffTreeContainer.find('.diff-tree-toolbar')).on('focus', 'input', function () {
            toggleDiffTree(false);
        }));
    }

    function initDiffTree() {
        $('.no-changes-placeholder').remove();

        var filePath = currentFilePath ? currentFilePath : getPathFromUrl();
        return updateDiffTree(filePath.path.getComponents()).then(function (diffTree) {
            var $node = diffTree.getSelectedFile();
            if ($node && $node.length) {
                return initFileContentFromChange(getFileChangeFromNode($node), filePath.line);
            } else {
                return destroyFileContent().done(function () {
                    /* Append a placeholder <div> to keep the table-layout so that
                       the diff-tree does not consume the entire page width */
                    $('.commit-files').append($('<div class="message no-changes-placeholder"></div>').text(AJS.I18n.getText('bitbucket.web.no.changes.to.show')));
                });
            }
        });
    }

    function createDiffTree(_options) {
        return new DiffTree('.file-tree-wrapper', '.diff-tree-toolbar .aui-toolbar2-primary', currentCommitRange, {
            maxChanges: _options.maxChanges,
            hasOtherParents: _options.numberOfParents > 1,
            urlBuilder: _options.changesUrlBuilder,
            searchUrlBuilder: _options.diffUrlBuilder
        });
    }

    exports.updateCommitRange = function (commitRange) {
        if (commitRange.getId() === currentCommitRange.getId()) {
            // bail out if not actually changing the diff.
            return;
        }

        currentCommitRange = commitRange;
        currentDiffTree.reset(); // unbind any event listeners

        if (Object.prototype.hasOwnProperty.call(diffTreesByCommitRangeId, currentCommitRange.getId())) {
            // Use cached difftree if it exists.
            currentDiffTree = diffTreesByCommitRangeId[currentCommitRange.getId()];
        } else {
            currentDiffTree = createDiffTree(_options);
            diffTreesByCommitRangeId[currentCommitRange.getId()] = currentDiffTree;
        }

        initDiffTree();
    };

    function onSelectedNodeChanged($node, initializingTree) {
        // Only set the hash if we're here from a user clicking a file name.
        // If it's a popState or a pushState or hashchange, the hash should already be set correctly.
        // If we're initializing a full tree, we want an empty hash.
        // If we're initializing a full tree BECAUSE of a changeState, the hash should still already be set correctly.
        if (!changingState && !initializingTree) {
            window.location.hash = $node ? encodeURI(getPathFromNode($node).toString()) : '';
        }
    }

    exports.init = function (commitRange, options) {
        _options = $.extend({}, exports.defaults, options);

        $footer = $('#footer');
        $content = $('#content');
        $container = $content.find('.commit-files');
        $fileTreeContainer = $('.file-tree-container');
        $fileTreeWrapper = $fileTreeContainer.children('.file-tree-wrapper');
        windowHeight = $window.height();
        $commitFileContent = $('#commit-file-content');

        currentCommitRange = commitRange;
        currentDiffTree = createDiffTree(_options);
        diffTreesByCommitRangeId[currentCommitRange.getId()] = currentDiffTree;
        currentFilePath = getPathFromUrl();

        $window.on('hashchange', onStateChange);

        initDiffTreeToggle();
        initDiffTree();

        _destroyables.push(events.chain().on('window.resize', onTreeAndDiffViewSizeChanged).on('bitbucket.internal.feature.fileContent.diffViewExpanded', onTreeAndDiffViewSizeChanged).on('bitbucket.internal.feature.commit.difftree.selectedNodeChanged', onSelectedNodeChanged));
        _destroyables.push({ destroy: shortcuts.bind('requestToggleDiffTreeHandler', _.ary(toggleDiffTree, 0)) });
        _destroyables.push({ destroy: shortcuts.bind('requestMoveToNextHandler', _.ary(currentDiffTree.openNextFile.bind(currentDiffTree), 0)) });
        _destroyables.push({ destroy: shortcuts.bind('requestMoveToPreviousHandler', _.ary(currentDiffTree.openPrevFile.bind(currentDiffTree), 0)) });

        // Always expand the difftree - hence the 'false' here
        _destroyables.push(events.chainWith(currentDiffTree).on('search-focus', _.partial(toggleDiffTree, false)));
    };

    //Visible for testing
    exports._initDiffTreeToggle = initDiffTreeToggle;

    exports.reset = function () {
        if (currentDiffTree) {
            currentDiffTree.reset();
        }

        currentCommitRange = undefined;
        currentDiffTree = undefined;
        diffTreesByCommitRangeId = {};
        currentFilePath = undefined;
        currentSearch = undefined;

        $window.off('hashchange', onStateChange);

        _.invoke(_destroyables, 'destroy');

        return destroyFileContent();
    };

    // visible for testing
    exports._onSelectedNodeChanged = onSelectedNodeChanged;

    exports.defaults = {
        breadcrumbs: true,
        changeTypeLozenge: true,
        changeModeLozenge: true,
        contentMode: FileContentModes.DIFF,
        linkToCommit: false,
        sourceLink: true,
        toolbarWebFragmentLocationPrimary: null,
        toolbarWebFragmentLocationSecondary: null
    };

    exports.commentMode = FileContent.commentMode;
});