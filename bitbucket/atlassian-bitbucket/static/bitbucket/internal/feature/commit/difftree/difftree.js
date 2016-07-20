'use strict';

define('bitbucket/internal/feature/commit/difftree', ['aui', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/util/state', 'bitbucket/internal/feature/commit/difftree/difftree-search', 'bitbucket/internal/model/content-tree-node-types', 'bitbucket/internal/model/path-and-line', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/events', 'bitbucket/internal/util/property', 'exports'], function (AJS, $, _, nav, state, DiffTreeSearch, ContentNodeType, PathAndLine, ajax, events, propertyUtil, exports) {

    /**
     * This is the data format expected for jstree.
     *
     * @typedef {object} DiffTreeData
     * @property {Array<DiffTreeData>} children
     * @property {Object} metadata
     * @property {boolean} searchTruncated
     * @property {{title: string, attr: Object}} data
     */

    var pathSeparator = '/';
    var DEFAULT_COMMIT_LIMIT = 1000;
    var defaultMaximumOpen = 200;
    // Magic number based on our own PR usage - if there are < 50 files the diff is likely to be small (and can be cached)
    // See STASHDEV-7008 ticket for more details
    var MAX_FILES_SMALL_DIFF = 50;

    function openTree(tree, maximumOpen) {
        maximumOpen = maximumOpen >= 0 ? maximumOpen : defaultMaximumOpen;
        var opened = 0;
        function openNodes(node) {
            if (node.metadata.isDirectory) {
                node.state = 'open';
                node.data.icon = 'aui-icon aui-icon-small aui-iconfont-devtools-folder-open';
                var i;
                var l = node.children.length;
                var child;
                for (i = 0; i < l && opened < maximumOpen; i++) {
                    child = node.children[i];
                    openNodes(child);
                }
            } else if (node.metadata.isFile) {
                // May have search result children
                if (node.children && node.children.length > 0) {
                    node.state = 'open';
                }
                opened += node.children ? node.children.length : 1;
            }
        }
        openNodes(tree);
        return tree;
    }

    function compareTreeNodes(a, b) {
        return a.children ? b.children ? a.data.title.toLowerCase() < b.data.title.toLowerCase() ? -1 : 1 : -1 : !b.children ? a.data.title.toLowerCase() < b.data.title.toLowerCase() ? -1 : 1 : 1;
    }

    function flattenTree(tree) {
        tree.childrenByTypeAndComponent = undefined;
        var i;
        var l = tree.children.length;
        var child;
        var components;
        for (i = 0; i < l; i++) {
            child = tree.children[i];
            if (child.metadata.isDirectory) {
                components = [child.data.title];
                while (child.children.length === 1 && child.children[0].metadata.isDirectory) {
                    child = child.children[0];
                    components.push(child.data.title);
                }
                child.data.title = AJS.escapeHtml(components.join(pathSeparator));
                tree.children[i] = child;
                flattenTree(child);
            }
        }
        tree.children.sort(compareTreeNodes);
    }

    function computeTree(changes, maximumOpen) {

        var tree = {
            data: {
                icon: "aui-icon aui-icon-small aui-iconfont-devtools-folder-closed"
            },
            state: 'closed',
            metadata: {
                isDirectory: true
            },
            children: [],
            childrenByTypeAndComponent: {}
        };
        var i;
        var l = changes.length;
        var change;
        var subTree;
        for (i = 0; i < l; i++) {
            change = changes[i];
            subTree = tree;
            var j;
            var k = change.path.components.length;
            var component;
            var key;
            var child;
            for (j = 0; j < k; j++) {
                component = change.path.components[j];
                key = (j + 1 === k ? 'F' : 'D') + component;
                if (Object.prototype.hasOwnProperty.call(subTree.childrenByTypeAndComponent, key)) {
                    subTree = subTree.childrenByTypeAndComponent[key];
                } else {
                    var isLastPathComponent = j + 1 === k;
                    if (isLastPathComponent) {
                        var hasComments = !!(change.properties && change.properties.activeComments);
                        child = {
                            data: {
                                title: AJS.escapeHtml(component),
                                icon: "aui-icon aui-icon-small " + (change.nodeType === ContentNodeType.SUBMODULE ? 'aui-iconfont-devtools-submodule' : hasComments ? "aui-iconfont-devtools-file-commented" : "aui-iconfont-devtools-file"),
                                attr: {
                                    id: 'change' + i,
                                    "class": "difftree-file change-type-" + change.type + (change.conflict ? " conflict" : ""),
                                    href: "#" + encodeURI(change.path.toString),
                                    title: change.conflict ? AJS.I18n.getText('bitbucket.web.pullrequest.tree.conflicted.file') : hasComments ? AJS.I18n.getText('bitbucket.web.pullrequest.tree.commented.file') : undefined
                                }
                            },
                            metadata: {
                                isFile: true,
                                changeType: change.type,
                                nodeType: change.nodeType,
                                path: change.path,
                                srcPath: change.srcPath,
                                conflict: change.conflict,
                                contentId: change.contentId,
                                fromContentId: change.fromContentId,
                                executable: change.executable,
                                srcExecutable: change.srcExecutable
                            }
                        };
                    } else {
                        child = {
                            data: {
                                title: AJS.escapeHtml(component),
                                icon: "aui-icon aui-icon-small aui-iconfont-devtools-folder-closed"
                            },
                            state: 'closed',
                            metadata: {
                                isDirectory: true
                            },
                            children: [],
                            childrenByTypeAndComponent: {}
                        };
                    }
                    subTree.children.push(child);
                    subTree = subTree.childrenByTypeAndComponent[key] = child;
                }
            }
        }
        flattenTree(tree);
        openTree(tree, maximumOpen);
        return tree;
    }

    /**
     * Get a builder to build the URL used to fetch the file changes.
     *
     * @param {number} start start index
     * @param {number} limit max number of changes
     * @param {CommitRange} commitRange commit range describing the source and target commits
     * @returns {bitbucket/util/navbuilder.Builder} a builder to build the URL used to fetch the file changes
     * @private
     */
    function urlBuilder(start, limit, commitRange) {
        return nav.rest().currentRepo().changes(commitRange).withParams({ start: start, limit: limit });
    }

    /**
     * Renders a tree of changed files.
     *
     * @param {string} wrapperSelector selector for the surrounding container
     * @param {string} toolbarSelector selector for toolbar (for adding search bar)
     * @param {CommitRange} commitRange commit range of the parent diff
     * @param {Object} [options] optional properties for the tree
     * @constructor
     */
    function DiffTree(wrapperSelector, toolbarSelector, commitRange, options) {
        options = options || {};

        this._fileLimit = options.maxChanges || DEFAULT_COMMIT_LIMIT;
        propertyUtil.getFromProvider('page.max.diff.lines').done(function (val) {
            this._maxDiffLines = val;
        }.bind(this));
        this._$wrapper = $(wrapperSelector);
        this._$toolbar = $(toolbarSelector);
        this._commitRange = commitRange;
        this._hasOtherParents = !!options.hasOtherParents;
        this._urlBuilder = options.urlBuilder || urlBuilder;
        this._searchUrlBuilder = options.searchUrlBuilder;
    }

    _.extend(DiffTree.prototype, events.createEventMixin("diffTree", { localOnly: true }));

    DiffTree.prototype.init = function (selectedPathComponents) {
        this._destroyables = [];
        this._selectedPathComponents = selectedPathComponents;
        this._firstCommentAddedHandler = _.bind(this._firstCommentAddedHandler, this);
        this._lastCommentDeletedHandler = _.bind(this._lastCommentDeletedHandler, this);

        this._destroyables.push(events.chain().on('bitbucket.internal.feature.comments.firstCommentAdded', this._firstCommentAddedHandler).on('bitbucket.internal.feature.comments.lastCommentDeleted', this._lastCommentDeletedHandler));

        if (this._searchUrlBuilder) {
            this._destroyables.push(this._addSearch());
        }

        if (!this.data) {
            return this.requestData();
        } else {
            return this.dataReceived(this.data);
        }
    };

    DiffTree.prototype._addSearch = function () {
        var _this = this;

        var _destroyables = [];
        var search = new DiffTreeSearch.DiffTreeSearch();
        var $fileTreeHeader = this._$wrapper.siblings('.file-tree-header');
        var $searchWrapper = $(bitbucket.internal.feature.difftree.searchWrapper({
            includeCollapseButton: !$fileTreeHeader.length
        }));
        $searchWrapper.prepend(search.input.$el);
        if ($fileTreeHeader.length) {
            // if we're in a PR, the search goes in a different place.
            $fileTreeHeader.after($searchWrapper);
            _destroyables.push({ destroy: function destroy() {
                    return $searchWrapper.remove();
                } });
        } else {
            (function () {
                var $replacedTitle = _this._$toolbar.find('h4');
                $replacedTitle.replaceWith($searchWrapper);
                _destroyables.push({ destroy: function destroy() {
                        return $searchWrapper.replaceWith($replacedTitle);
                    } });
            })();
        }

        _destroyables.push(search);
        _destroyables.push(events.chainWith($searchWrapper.find(".search-button-when-collapsed")).on('click', function () {
            search.focusSearch();
        }));
        _destroyables.push(events.chainWith(search).on('search-focus', _.bind(this.trigger, this, 'search-focus')));
        _destroyables.push({
            destroy: search.register(function (filter) {
                var isSmallDiff = function isSmallDiff() {
                    return _this._getFileCount(_this.data, MAX_FILES_SMALL_DIFF) < MAX_FILES_SMALL_DIFF;
                };
                $searchWrapper.addClass('searching');
                return ajax.rest({
                    // Use '' to search for everything
                    url: _this._searchUrlBuilder({ path: '', commitRange: _this._commitRange.toJSON() }).withParams({ withComments: false })
                    // Pull Requests aren't cacheable (yet), so _always_ send the filter
                    // NOTE: We still do the filter client-side, but the cost is cheap
                    .withParams(filter && (_this._commitRange.getPullRequest() || !isSmallDiff()) ? { filter: filter } : {}).build()
                }).done(function () {
                    return $searchWrapper.removeClass('searching');
                });
            },
            // Needs to be a lazy callback as 'data' may not be initialized yet
            function () {
                return _this.data;
            }).onValue(function (newData) {
                $searchWrapper.toggleClass('searching', Boolean(newData.search));

                // Take a copy of the data before we re-render (so we can restore at a later point)
                _this.data_copy = _this.data;
                // Make sure we render the correct message
                _this._searchEmpty = newData.data.children.length === 0;
                // TODO Yet another place where using events to talk directly to the diff-view :(
                events.trigger('bitbucket.internal.feature.diffView.highlightSearch', null, newData.search);
                // Re-render the tree
                _this.dataReceived(openTree(newData.data)).done(function () {
                    _this.data = _this.data_copy;
                    // Cleanup empty flag - no longer needed
                    _this._searchEmpty = null;
                });
            })
        });
        return {
            destroy: function destroy() {
                _.invoke(_destroyables, 'destroy');
            }
        };
    };

    DiffTree.prototype._getFileCount = function (data, max) {
        function countFiles(data) {
            return _.reduce(data.children, function (count, childData) {
                if (count < max) {
                    return count + (childData.metadata.isFile ? 1 : countFiles(childData));
                } else {
                    // Break out early - no point recursing any further
                    return count;
                }
            }, 0);
        }
        return countFiles(data);
    };

    DiffTree.prototype._firstCommentAddedHandler = function () {
        var $icon = this.getSelectedFile().find('a > ins');
        $icon.hide().removeClass('aui-iconfont-devtools-file').addClass('aui-iconfont-devtools-file-commented').fadeIn('slow');
    };

    DiffTree.prototype._lastCommentDeletedHandler = function () {
        var $icon = this.getSelectedFile().find('a > ins');
        $icon.hide().removeClass('aui-iconfont-devtools-file-commented').addClass('aui-iconfont-devtools-file').fadeIn('slow');
    };

    DiffTree.prototype.reset = function () {
        if (this._request) {
            this._request.abort();
            this._request = null;
            this._interrupted = true;
        }
        if (this._rendering) {
            this._rendering = false;
            this._interrupted = true;
        }
        _.invoke(this._destroyables, 'destroy');
    };

    DiffTree.prototype.requestData = function () {
        var self = this;

        if (this._request) {
            this._request.abort();
            this._request = null;
        }
        this._request = ajax.rest({
            url: self._urlBuilder(0, self._fileLimit, self._commitRange).build()
        });
        return this._request.always(function () {
            self._request = null;
        }).then(function (data) {
            if (!data) {
                var msg = AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.pullrequest.tree.nodata'));
                self.prependMessage(msg, "error");
                return $.Deferred().reject();
            } else {
                self._rendering = true;
                self._interrupted = false;

                self.isTruncated = !data.isLastPage;

                return self.dataReceived(computeTree(data.values)).done(function () {
                    self._rendering = false;
                });
            }
        });
    };

    /**
     * This function will return the file node whose path matches your preferredPathComponents if it can.
     * If it can't, it'll instead return the first file node in the tree.
     * If there are no file nodes, it'll return null;
     *
     * It's used for selecting an initial node in the file tree when the tree is being initialized.
     *
     * @param data a flattened tree (usually the diffTree.data object)
     * @param preferredPathComponents the path components of the file to attempt to select - array of strings.
     */
    function getNodeToSelect(data, preferredPathComponents) {
        return getPreferredNode(data, preferredPathComponents) || getFirstNode(data);
    }

    /**
     * @returns the file node which matches the preferredPathComponents, or null if none match
     */
    function getPreferredNode(preferred, preferredComponents) {
        if (!preferredComponents) {
            return null;
        }
        preferredComponents = preferredComponents.slice(0);

        while (preferred && preferred.children) {
            var componentToMatch = preferredComponents.shift();
            var isLastComponent = !preferredComponents.length;

            var i = preferred.children.length;
            while (i--) {
                var childToCheck = preferred.children[i];
                var title = childToCheck.data.title;

                if (componentToMatch === title && isLastComponent === Boolean(childToCheck.metadata.isFile)) {
                    //matches exactly, go inside.
                    preferred = childToCheck;
                    break;
                }

                // this is a collapsed node that at least partially matches, keep pulling off components
                if (!isLastComponent && _.startsWith(title, componentToMatch + pathSeparator)) {

                    while (preferredComponents.length > 1 && _.startsWith(title, componentToMatch + pathSeparator + preferredComponents[0])) {
                        componentToMatch += pathSeparator;
                        componentToMatch += preferredComponents.shift();
                    }

                    if (title !== componentToMatch) {
                        // they passed in a bad path, we're not going to find it.
                        //this handles:
                        // - preferredPath too short
                        // - preferredPath partially matches a collapsed node
                        return null;
                    }
                    //else collapsed node was fully matched.
                    preferred = childToCheck;
                    break;
                }

                //this child doesn't match
            }

            if (i < 0) {
                // no child matched
                return null;
            }
        }

        return preferred && preferred.metadata && preferred.metadata.isFile ? preferred : null;
    }

    function getFirstNode(first) {
        while (first && first.children) {
            first = first.children[0];
        }
        return first && first.metadata && first.metadata.isFile ? first : null;
    }

    function getPathFromRoot(tree, toNode) {

        if (tree === toNode) {
            return [toNode];
        }

        var i = tree.children ? tree.children.length : 0;
        while (i--) {
            var childResult = getPathFromRoot(tree.children[i], toNode);
            if (childResult) {
                childResult.unshift(tree);
                return childResult;
            }
        }

        return null;
    }

    DiffTree.prototype.prependMessage = function (contents, type) {
        this._$wrapper.find(".aui-message").remove();

        type = type || "warning";

        this._$wrapper.find('.file-tree').before(aui.message[type]({
            extraClasses: 'diff-tree-scm-message',
            content: contents
        }));
    };

    DiffTree.prototype.dataReceived = function (data) {
        var self = this;
        this.data = data;

        var deferred = $.Deferred();
        function resolveIfNotInterrupted() {
            if (!self._interrupted) {
                deferred.resolve(self);
            } else {
                deferred.reject(self);
            }
        }

        var initiallySelectedNode = getNodeToSelect(this.data, this._selectedPathComponents);
        var initiallySelectedIdArray;

        if (initiallySelectedNode) {
            initiallySelectedIdArray = [initiallySelectedNode.data.attr.id];

            // open the ancestors of the selected node.
            var toOpen = getPathFromRoot(this.data, initiallySelectedNode) || [];

            toOpen.pop(); // don't open the file, just the folders above it. Otherwise the file gets a twixie.

            while (toOpen.length) {
                toOpen.pop().state = 'open';
            }
        } else {
            initiallySelectedIdArray = [];
        }

        var initializingTree = true;

        var $currentlySelectedNode;

        this._$wrapper.find(".aui-message").remove();
        if (this.isTruncated) {
            var contents = "";

            if (this._commitRange.getPullRequest()) {
                //TODO - Better message for pull request commits that are too large to render.
                contents = AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.pullrequest.tree.truncated', this._fileLimit));
            } else {
                var gitCommand;
                var atRevision = this._commitRange.getUntilRevision();
                var parentRevision = this._commitRange.getSinceRevision();

                if (parentRevision) {
                    gitCommand = 'git diff-tree -C -r ' + parentRevision.getId() + ' ' + atRevision.getId();
                } else {
                    gitCommand = 'git diff-tree -r --root ' + atRevision.getId();
                }

                contents = AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.commit.tree.truncated', this._fileLimit)) + '<p class="scm-command">' + AJS.escapeHtml(gitCommand) + '</p>';
            }

            this.prependMessage(contents, "warning");
        }
        if (this.data.children.length) {
            if (this.data.searchTruncated) {
                self.prependMessage(AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.commit.tree.truncated.search', this._maxDiffLines)), "info");
            }
            this.$tree = this._$wrapper.children(".file-tree");
            this.$tree.fadeOut('fast', function () {
                self.$tree.empty().off('.jstree').jstree("destroy").on('loaded.jstree', function () {
                    //allow jstree plugins to finish loading (namely ui).
                    setTimeout(function () {
                        initializingTree = false;
                        resolveIfNotInterrupted();
                    }, 0);
                }).jstree({
                    json_data: {
                        data: self.data.children,
                        progressive_render: true
                    },
                    core: {
                        html_titles: true,
                        animation: 200
                    },
                    ui: {
                        select_limit: 1,
                        selected_parent_close: false,
                        initially_select: initiallySelectedIdArray /* use this for deeplinking */
                    },
                    plugins: ["json_data", "ui"]
                }).on('before.jstree', function (e, data) {
                    if (data.func === 'select_node') {
                        var $node = $(data.args[0]).parent();

                        if ($node.hasClass('jstree-leaf') && (!$currentlySelectedNode || $currentlySelectedNode[0] !== $node[0])) {
                            $currentlySelectedNode = $node;
                            events.trigger('bitbucket.internal.feature.commit.difftree.selectedNodeChanged', self, $node, initializingTree);
                            self._selectedPathComponents = new PathAndLine($node.data('path')).path.getComponents();
                        } else if ($node.length > 0) {
                            // Node can be missing before tree has fully refreshed after a search clear
                            self.$tree.jstree("toggle_node", $node);
                            return false; //e.preventDefault() doesn't work...
                        } // else { ignore everything else }
                    }
                }).on('open_node.jstree', function (e, data) {
                    var $openedNode = data.args[0];
                    // We may be opening a file with search results
                    if ($openedNode.data().isDirectory) {
                        var $nodeIcon = $openedNode.children('a').children('ins');
                        $nodeIcon.removeClass('aui-iconfont-devtools-folder-closed');
                        $nodeIcon.addClass('aui-iconfont-devtools-folder-open');
                    }
                    events.trigger('bitbucket.internal.feature.commit.difftree.nodeOpening', self, $openedNode);
                }).on('after_open.jstree', function (e, data) {
                    var $openedNode = data.args[0];
                    events.trigger('bitbucket.internal.feature.commit.difftree.nodeOpened', self, $openedNode);
                }).on('close_node.jstree', function (e, data) {
                    var $closedNode = data.args[0];
                    if ($closedNode.data().isDirectory) {
                        var $nodeIcon = $closedNode.children('a').children('ins');
                        $nodeIcon.removeClass('aui-iconfont-devtools-folder-open');
                        $nodeIcon.addClass('aui-iconfont-devtools-folder-closed');
                    }
                    events.trigger('bitbucket.internal.feature.commit.difftree.nodeClosing', self, $closedNode);
                }).on('after_close.jstree', function (e, data) {
                    var $closedNode = data.args[0];
                    events.trigger('bitbucket.internal.feature.commit.difftree.nodeClosed', self, $closedNode);
                }).on('loaded.jstree', function (e, data) {
                    events.trigger('bitbucket.internal.feature.commit.difftree.treeInitialised', self, self);
                }).fadeIn('fast');
            });
        } else {
            this.$tree = undefined;
            var $fileTree = this._$wrapper.children(".file-tree");
            $fileTree.fadeOut('fast', function () {
                $fileTree.empty().off('.jstree').jstree("destroy");
                var emptyTruncatedSearch = self._searchEmpty && self.data.searchTruncated;
                var message = AJS.escapeHtml(emptyTruncatedSearch ? AJS.I18n.getText('bitbucket.web.commit.tree.truncated.search', self._maxDiffLines) + " " + AJS.I18n.getText('bitbucket.web.commit.tree.emptysearch') : self._searchEmpty ? AJS.I18n.getText('bitbucket.web.commit.tree.emptysearch') : self._hasOtherParents ? AJS.I18n.getText('bitbucket.web.commit.merge.tree.empty') : AJS.I18n.getText('bitbucket.web.commit.tree.empty'));
                self.prependMessage(message, "info");
                setTimeout(resolveIfNotInterrupted, 0);
            });
        }
        return deferred.promise().always(function () {
            // This is purely for the browser tests - most reliable way of waiting for an update
            self._$wrapper.attr('data-last-updated', new Date().getTime());
        });
    };

    /**
     * @returns {?jQuery} the selected jstree node
     */
    DiffTree.prototype.getSelectedFile = function () {
        return this.$tree ? this.$tree.jstree('get_selected') : null;
    };

    /**
     * @returns {?jQuery} the selected jstree node or the jstree jquery element if nothing is selected.
     *                    Used by next/previous to select the first node.
     */
    DiffTree.prototype._getSelectedFileOrTree = function () {
        var $node = this.getSelectedFile();
        return $node && $node.length > 0 ? $node : this.$tree;
    };

    DiffTree.prototype.selectFile = function (pathComponents) {
        if (!this.$tree) {
            return;
        }
        var nodeToSelect = getNodeToSelect(this.data, pathComponents);
        var currentlySelectedFile = this.getSelectedFile();
        var currentlySelectedPath = currentlySelectedFile && currentlySelectedFile.data('path');
        var currentlySelectedNode = currentlySelectedPath && getNodeToSelect(this.data, new PathAndLine(currentlySelectedPath).path.getComponents());

        if (nodeToSelect && nodeToSelect !== currentlySelectedNode) {
            // TODO STASHDEV-7022 - Fix back button for selecting lines (works for just files)
            // NOTE: This is only needed for state changes - everything is handled nicely
            this.$tree.jstree('deselect_all').jstree('select_node', '#' + nodeToSelect.data.attr.id);
        }
    };

    DiffTree.prototype.openNextFile = function () {
        if (this.$tree) {
            var jstree = $.jstree._reference(this.$tree);
            var $currentNode = this._getSelectedFileOrTree();
            var $nextFile = findFile(jstree, jstree._get_next, jstree._get_next($currentNode));

            if ($nextFile && $nextFile.length) {
                $nextFile.find('a').focus().click();
            }
        }
    };

    DiffTree.prototype.openPrevFile = function () {
        if (this.$tree) {
            var jstree = $.jstree._reference(this.$tree);
            var $currentNode = this._getSelectedFileOrTree();
            var $prevFile = findPrevFileOrClosedDir(jstree, jstree._get_prev($currentNode));

            if ($prevFile && $prevFile.length) {
                $prevFile.find('a').focus().click();
            }
        }
    };

    /* Find leaf based on the getAdjacentNode function passed in */
    function findFile(jstree, getAdjacentNode, $node) {
        if ($node && $node.length && !$node.hasClass('jstree-leaf')) {
            jstree.open_node($node);
            $node = findFile(jstree, getAdjacentNode, getAdjacentNode.call(jstree, $node));
        }

        return $node;
    }

    /* Traverse up til you find a leaf OR closed directory then find its last leaf */
    function findPrevFileOrClosedDir(jstree, $node) {
        if ($node && !$node.hasClass('jstree-leaf')) {
            if ($node.hasClass('jstree-closed')) {
                jstree.open_node($node);
                $node = findFile(jstree, getLastChild, getLastChild.call(jstree, $node));
            } else if ($node.length) {
                $node = findPrevFileOrClosedDir(jstree, jstree._get_prev($node));
            }
        }

        return $node;
    }

    function getLastChild($node) {
        return this._get_children($node).filter('.jstree-last');
    }

    exports.DiffTree = DiffTree;
    exports.computeTree = computeTree;
    exports.flattenTree = flattenTree;
    exports._openTree = openTree;
    exports.compareTreeNodes = compareTreeNodes;
    exports.getNodeToSelect = getNodeToSelect;
    exports.getPathFromRoot = getPathFromRoot;
});