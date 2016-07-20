'use strict';

define('bitbucket/internal/page/filebrowser', ['aui', 'jquery', 'lodash', 'bitbucket/internal/feature/filebrowser/file-finder', 'bitbucket/internal/feature/filebrowser/file-table', 'bitbucket/internal/model/content-tree-node-types', 'bitbucket/internal/model/path', 'bitbucket/internal/model/revision-reference', 'bitbucket/internal/util/events', 'exports'], function (AJS, $, _, finder, filetable, ContentNodeType, Path, RevisionReference, events, exports) {

    var FileTable = filetable.FileTable;
    var FileTableView = filetable.FileTableView;
    var FileFinder = finder.FileFinder;
    var dialogIsShowing;

    var fileTable;
    var fileTableView;
    var fileFinder;

    var findFilesTooltip;
    var browseFilesTooltip;
    var $findFilesItem;
    var $content;
    var $findFilesButton;
    var $browseFilesButton;

    function getFileNamesFromDOM() {
        return $content.find(".file-row a").map(function (i, row) {
            var $row = $(row);
            var $parent = $row.parent().parent();
            return {
                name: $row.text(),
                contentId: $row.attr('data-contentId'),
                type: $parent.hasClass('file') ? ContentNodeType.FILE : $parent.hasClass('directory') ? ContentNodeType.DIRECTORY : ContentNodeType.SUBMODULE
            };
        }).toArray();
    }

    exports.onReady = function (path, revisionRef, fileTableContainer, maxDirectoryChildren) {
        var currentPath = new Path(path);
        var currentRevisionRef = new RevisionReference(revisionRef);

        $findFilesItem = $('.find-files');
        $content = $('.filebrowser-content');
        $findFilesButton = $findFilesItem.find('.find-files-button');
        $browseFilesButton = $findFilesItem.find('.browse-files-button');

        fileTableView = new FileTableView(fileTableContainer);

        fileTable = new FileTable(currentPath, currentRevisionRef, maxDirectoryChildren);

        fileFinder = new FileFinder(fileTableContainer, currentRevisionRef);

        $(document).on('focus', '#browse-table tr.file-row', function () {
            $('.focused-file').removeClass('focused-file');
            $(this).addClass('focused-file');
        });

        events.on('bitbucket.internal.history.popstate', function (e) {
            if (e.state) {
                currentRevisionRef = new RevisionReference(e.state.revisionRef);
            } // else ignore hashchange events
        });

        var pipeRevisionChanged = function pipeRevisionChanged(revisionReference) {
            if (currentRevisionRef !== revisionReference) {
                currentRevisionRef = revisionReference;
                events.trigger('bitbucket.internal.page.filebrowser.revisionRefChanged', null, revisionReference);
            }
        };
        events.on('bitbucket.internal.layout.branch.revisionRefChanged', pipeRevisionChanged);
        events.on('bitbucket.internal.feature.filetable.revisionRefChanged', pipeRevisionChanged);

        events.on('bitbucket.internal.widget.branchselector.dialogShown', function () {
            dialogIsShowing = true;
        });
        events.on('bitbucket.internal.widget.branchselector.dialogHidden', function () {
            dialogIsShowing = false;
        });

        var pipeUrlChanged = function pipeUrlChanged(url) {
            events.trigger('bitbucket.internal.page.filebrowser.urlChanged', null, url);
        };
        events.on('bitbucket.internal.layout.*.urlChanged', pipeUrlChanged);
        events.on('bitbucket.internal.feature.*.urlChanged', pipeUrlChanged);

        events.on('bitbucket.internal.feature.*.pathChanged', function (path) {
            currentPath = new Path(path);
            events.trigger('bitbucket.internal.page.filebrowser.pathChanged', null, currentPath.toJSON());
        });

        events.on('bitbucket.internal.widget.keyboard-shortcuts.register-contexts', function (keyboardShortcuts) {
            keyboardShortcuts.enableContext('filebrowser');
        });

        var showFinder = function showFinder() {
            if (!fileFinder.isLoaded()) {
                $findFilesButton.attr('aria-pressed', true);
                $browseFilesButton.attr('aria-pressed', false);

                fileFinder.loadFinder();
            }
        };

        var hideFinder = function hideFinder() {
            if (fileFinder.isLoaded()) {
                $findFilesButton.attr('aria-pressed', false);
                $browseFilesButton.attr('aria-pressed', true);

                fileFinder.unloadFinder();

                if (fileTable.data) {
                    fileTableView.update(fileTable.data);
                } else {
                    fileTable.reload();
                }
            }
        };

        events.on('bitbucket.internal.feature.filetable.showFind', showFinder);
        events.on('bitbucket.internal.feature.filetable.hideFind', hideFinder);
        //If the revision has changed, close the file finder and show the browse file link
        events.on('bitbucket.internal.page.filebrowser.revisionRefChanged', hideFinder);

        /**
         * Notify listeners of the initial files and when there are subsequent changes.
         */
        events.trigger('bitbucket.internal.feature.filebrowser.filesChanged', null, {
            files: getFileNamesFromDOM(),
            path: new Path(path).toJSON(),
            revision: currentRevisionRef.getId()
        });
        events.on('bitbucket.internal.feature.filetable.dataReceived', function (data) {
            if (isDataReceivedErrorResponse(data)) {
                return;
            }
            events.trigger('bitbucket.internal.feature.filebrowser.filesChanged', null, {
                files: data.children.values.map(function (child) {
                    return _.pick(child, 'name', 'contentId', 'type');
                }),
                path: data.path,
                revision: data.revisionRef && data.revisionRef.id
            });
        });

        $findFilesButton.click(function () {
            events.trigger('bitbucket.internal.feature.filetable.showFind');
            return false;
        });

        $browseFilesButton.click(function () {
            events.trigger('bitbucket.internal.feature.filetable.hideFind');
            return false;
        });

        listenForKeyboardShortcutRequests();
    };

    /**
     * Indicate whether the data object from a dataReceived event is an error response
     *
     * @param {object} [data]
     * @returns {boolean}
     */
    function isDataReceivedErrorResponse(data) {
        return !(data && data.children);
    }

    function listenForKeyboardShortcutRequests() {
        var options = {
            "focusedClass": "focused-file",
            "wrapAround": false,
            "escToCancel": false
        };
        var rowSelector = "#browse-table tr.file-row";
        var focusedRowSelector = rowSelector + '.' + options.focusedClass;

        events.on('bitbucket.internal.keyboard.shortcuts.requestMoveToNextHandler', function (keys) {
            (this.moveToNextItem ? this : AJS.whenIType(keys)).moveToNextItem(rowSelector, options);
        });
        events.on('bitbucket.internal.keyboard.shortcuts.requestMoveToPreviousHandler', function (keys) {
            (this.moveToPrevItem ? this : AJS.whenIType(keys)).moveToPrevItem(rowSelector, options);
        });
        events.on('bitbucket.internal.keyboard.shortcuts.requestOpenItemHandler', function (keys) {
            (this.execute ? this : AJS.whenIType(keys)).execute(function () {
                if (!dialogIsShowing) {
                    var $focusItem = $(focusedRowSelector);
                    if ($focusItem.length) {
                        if ($focusItem.hasClass('file')) {
                            events.trigger('bitbucket.internal.feature.filetable.showSpinner', this);
                            window.location.href = $focusItem.find('a').attr('href');
                        } else {
                            $focusItem.find('a').click();
                        }
                    }
                }
            });
        });
        events.on('bitbucket.internal.keyboard.shortcuts.requestOpenParentHandler', function (keys) {
            (this.execute ? this : AJS.whenIType(keys)).execute(function () {
                if (!dialogIsShowing) {
                    var $parentDir = $(fileTableView.getParentDirSelector());
                    if ($parentDir.length) {
                        $parentDir.click();
                    }
                }
            });
        });

        events.on('bitbucket.internal.keyboard.shortcuts.requestOpenFileFinderHandler', function (keys) {
            findFilesTooltip = AJS.I18n.getText('bitbucket.web.file.finder.findfiles.tooltip', keys);
            $findFilesButton.attr('title', findFilesTooltip).tooltip({
                gravity: 'ne'
            });

            (this.execute ? this : AJS.whenIType(keys)).execute(function () {
                events.trigger('bitbucket.internal.feature.filetable.showFind', this);
            });
        });
        events.on('bitbucket.internal.keyboard.shortcuts.requestCloseFileFinderHandler', function (keys) {
            browseFilesTooltip = AJS.I18n.getText('bitbucket.web.file.finder.browse.files.tooltip', keys);
            $browseFilesButton.attr('title', browseFilesTooltip).tooltip();

            (this.execute ? this : AJS.whenIType(keys)).execute(function () {
                events.trigger('bitbucket.internal.feature.filetable.hideFind', this);
            });
        });
    }
});