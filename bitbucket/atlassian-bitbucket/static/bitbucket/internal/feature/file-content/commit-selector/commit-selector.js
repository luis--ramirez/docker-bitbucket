'use strict';

define('bitbucket/internal/feature/file-content/commit-selector', ['aui', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/model/path', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/events', 'bitbucket/internal/widget/keyboard-controller', 'bitbucket/internal/widget/paged-scrollable'], function (AJS, $, _, nav, Path, ajax, events, keyboardController, PagedScrollable) {

    var ListKeyboardController = keyboardController.ListKeyboardController;

    /**
     * Select commits from a dropdown
     *
     * @param {Object} options
     * @param {String} options.id - a unique identifier for this selector
     * @param {jQuery|HTMLElement|String} options.buttonEl - the existing element to attach to as trigger
     * @constructor
     */
    function CommitSelector(options) {
        var _this = this;

        var id = options.id;
        var $selectorButton = this._$selectorButton = $(options.buttonEl);
        this._$selectorButtonText = $selectorButton.find(".aui-button-label");

        this._id = id;
        this._scrollPaneSelector = '#inline-dialog-' + id + ' .commit-selector';
        this._listSelector = this._scrollPaneSelector + " > ul";
        this._scrollable = null;

        var self = this;
        var _dialogInitialised = false;
        var $currentContent;

        var hideOnEscapeKeyUp = function hideOnEscapeKeyUp(e) {
            if (e.keyCode === AJS.keyCode.ESCAPE) {
                self.hide();
                e.preventDefault();
            }
        };
        var showOnClick = function showOnClick(e) {
            if (self.isButtonEnabled()) {
                self.show();
            }
            e.preventDefault();
        };
        var hideOnClick = function hideOnClick(e) {
            self.hide();
            e.preventDefault();
        };
        // _itemClicked is used in file-history-test.js
        var itemClicked = this._itemClicked = function (e) {
            self.hide();

            var $li = $(this);
            var $a = $li.children('a');
            var commitId = $a.attr('data-id');
            var commit = self._visibleCommits[commitId];
            var path = null;
            var sincePath = null;

            if (commit && commit.properties && commit.properties.change) {
                path = commit.properties.change.path ? new Path(commit.properties.change.path) : null;
                sincePath = commit.properties.change.srcPath ? new Path(commit.properties.change.srcPath) : null;
            }

            $('li', self._listSelector).removeClass('selected');
            $li.addClass('selected');

            self._renderButton(commit);
            events.trigger('bitbucket.internal.feature.commitselector.commitSelected', self, commit, self._pullRequest, path, sincePath);
            e.preventDefault();
        };

        var hide = function hide() {
            return _this.hide();
        };

        var onShowDialog = function onShowDialog($content, trigger, showPopup) {
            if (!_dialogInitialised) {
                _dialogInitialised = true;

                $currentContent = $content.html(bitbucket.internal.feature.fileContent.commitSelector());
                $currentContent.on('click', 'li.commit-list-item', itemClicked);

                showPopup();
                self._scrollable = self._createScrollable();
                self._visibleCommits = {};
                setTimeout(function () {
                    $content.find('.spinner-container').spin();
                    self._scrollable.init();
                }, 0);

                self._initialiseKeyboardNavigation();
                self._initialiseMouseNavigation();
            } else {
                showPopup();
            }

            $selectorButton.off('click', showOnClick);
            $selectorButton.on('click', hideOnClick);
            $(document).on('keyup', hideOnEscapeKeyUp);
            $(window).on('scroll', hide);
        };

        var onHideDialog = function onHideDialog() {
            $(window).off('scroll', hide);
            $(document).off('keyup', hideOnEscapeKeyUp);
            $selectorButton.off('click', hideOnClick);
            $selectorButton.on('click', showOnClick);
            if ($(document.activeElement).closest(self._scrollPaneSelector).length) {
                // if the focus is inside the dialog, you get stuck when it closes.
                document.activeElement.blur();
            }
        };

        this.resetDialog = function () {
            _this.hide();
            _this._scrollable && _this._scrollable.reset();
            $(document).off('keyup', hideOnEscapeKeyUp);
            $currentContent && $currentContent.off('click', 'li.commit-list-item', itemClicked);
            _dialogInitialised = false;
        };

        this._inlineDialog = AJS.InlineDialog($selectorButton, id, onShowDialog, {
            hideDelay: null,
            width: 483,
            noBind: true,
            hideCallback: onHideDialog
        });

        $selectorButton.on('click', showOnClick);
        this._events = events.chain().on('bitbucket.internal.feature.commitselector.commitSelected', self.hide).on('bitbucket.internal.page.*.revisionRefChanged', this.resetDialog).on('bitbucket.internal.page.*.pathChanged', this.resetDialog);
    }

    CommitSelector.prototype.init = function (options) {
        this._followRenames = options.followRenames;
        this._headRevisionRef = options.headRevisionReference;
        this._itemTemplate = options.itemTemplate;
        this._itemTitle = options.itemTitle;
        this._itemUrl = options.itemUrl;
        this._mode = options.mode;
        this._path = options.path;
        this._preloadItems = options.preloadItems;
        this._pullRequest = options.pullRequest;
        this._selectedCommit = options.selectedCommit;
        this._updateButton = options.updateButton;
        this._lastPageMessage = options.lastPageMessage || AJS.I18n.getText('bitbucket.web.file.history.allhistoryfetched');

        this._renderButton(options.selectedCommit);
    };

    CommitSelector.prototype.destroy = function () {
        this.resetDialog();
        this._events.destroy();
        this._inlineDialog.remove();
        if (this._resultsKeyboardController) {
            this._resultsKeyboardController.destroy();
            this._resultsKeyboardController = null;
        }
    };

    CommitSelector.prototype.show = function () {
        this._inlineDialog.show();
    };

    CommitSelector.prototype.hide = function () {
        this._inlineDialog.hide();
    };

    CommitSelector.prototype._createScrollable = function () {
        var scrollable = new PagedScrollable(this._scrollPaneSelector, {
            bufferPixels: 0,
            pageSize: 25,
            paginationContext: 'file-history',
            preventOverscroll: true
        });
        scrollable.requestData = this.requestData.bind(this);
        scrollable.attachNewContent = this.attachNewContent.bind(this);

        var oldOnFirstDataLoaded = scrollable.onFirstDataLoaded;

        scrollable.onFirstDataLoaded = function () {
            return oldOnFirstDataLoaded.apply(this, arguments);
        };

        return scrollable;
    };

    CommitSelector.prototype.requestData = function (start, limit) {
        this._inlineDialog.find('.spinner-container').spin();
        var urlBuilder;

        // Could potentially be extracted out of the commit selector as it toggles between file history and
        // pull request commit selector
        if (this._pullRequest) {
            urlBuilder = nav.rest().currentRepo().pullRequest(this._pullRequest.id).commits().withParams({
                start: start, limit: limit,
                avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'xsmall' })
            });
        } else {
            urlBuilder = nav.rest().currentRepo().commits().withParams({
                followRenames: this._followRenames,
                path: this._path.toString(),
                until: this._headRevisionRef.getId(),
                start: start, limit: limit,
                avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'xsmall' })
            });
        }

        return ajax.rest({
            url: urlBuilder.build()
        }).done(function (data) {
            if (data.size > 0) {
                return data;
            } else {
                // BSERV-8673 If there is no data the file must have been created in a merge
                // so do the REST call again with followRenames: false so merge commits are included
                return ajax.rest({
                    url: urlBuilder.withParams({
                        followRenames: false
                    }).build()
                });
            }
        });
    };

    function addCommitsToMap(commits, cache) {
        _.forEach(commits, function (commit) {
            cache[commit.id] = commit;
        });
    }

    CommitSelector.prototype.attachNewContent = function (data) {
        addCommitsToMap(data.values, this._visibleCommits);
        var self = this;
        var selectedCommitId = this._selectedCommit && this._selectedCommit.id;
        var commitSelectorItems = data.values.map(function (commit) {
            return bitbucket.internal.widget.commit.commitListItem({
                isSelected: selectedCommitId === commit.id,
                content: self._itemTemplate({
                    commit: commit,
                    href: self._itemUrl(commit, self)
                }),
                title: self._itemTitle ? self._itemTitle(commit.displayId) : '',
                isFocused: selectedCommitId === commit.id && data.start === 0
            });
        });

        var preloadItems = this._preloadItems && data.start === 0 ? this._preloadItems.map(function (item) {
            return bitbucket.internal.widget.commit.commitListItem({
                isSelected: item.selected,
                content: item.content,
                title: item.title || ''
            });
        }) : null;

        var $list = $(this._listSelector);
        $list.append(preloadItems).append(commitSelectorItems);

        var $spinner = $(this._scrollPaneSelector).children('.spinner-container');
        $spinner.spinStop();

        if (data.isLastPage) {
            $list.append(bitbucket.internal.feature.fileContent.commitSelectorNoMoreResults({
                lastPageMessage: this._lastPageMessage
            }));

            $spinner.remove();
        }
    };

    CommitSelector.prototype.isButtonEnabled = function () {
        return !this._$selectorButton.prop('disabled');
    };

    CommitSelector.prototype._initialiseKeyboardNavigation = function () {
        var commitSelector = this;
        var $scrollPane = $(commitSelector._scrollPaneSelector);

        if (commitSelector._resultsKeyboardController) {
            commitSelector._resultsKeyboardController.destroy();
        }

        var listEventTarget = commitSelector._$selectorButton;
        var resultsList = commitSelector._listSelector;
        commitSelector._resultsKeyboardController = new ListKeyboardController(listEventTarget, resultsList, {
            focusedClass: 'focused',
            itemSelector: 'li.commit-list-item',
            adjacentItems: true,
            requestMore: function requestMore() {
                var loadAfterPromise = commitSelector._scrollable.loadAfter();
                return loadAfterPromise && loadAfterPromise.then(function (data) {
                    return data.isLastPage;
                });
            },
            onSelect: function onSelect($focused) {
                if (!commitSelector._inlineDialog.is(':visible')) {
                    commitSelector._$selectorButton.click();
                } else {
                    $focused.click();
                }
            },
            onFocusLastItem: function onFocusLastItem() {
                $scrollPane.scrollTop($scrollPane[0].scrollHeight);
            }
        });
    };

    CommitSelector.prototype._initialiseMouseNavigation = function () {
        var $listSelector = $(this._listSelector);
        var focusedClass = 'focused';

        $listSelector.on('mouseenter', 'li', function (e) {
            var $li = $(e.currentTarget);

            // return early if element already has the focused class
            if ($li.find('.' + focusedClass).length) {
                return;
            }
            $listSelector.find('.' + focusedClass).removeClass(focusedClass);
            $li.addClass(focusedClass);
        });
    };

    CommitSelector.prototype._renderButton = function (commit) {
        if (this._updateButton) {
            this._$selectorButton.children('.commit-icon').replaceWith(bitbucket.internal.feature.fileContent.commitSelectorItemIcon({ commit: commit }));
            this._$selectorButtonText.text(commit ? commit.message : AJS.I18n.getText('bitbucket.web.diff.all.changes.displayed'));
        }
    };

    return CommitSelector;
});