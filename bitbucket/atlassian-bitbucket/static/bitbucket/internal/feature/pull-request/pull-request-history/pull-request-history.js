'use strict';

define('bitbucket/internal/feature/pull-request/pull-request-history', ['jquery', 'bitbucket/internal/util/client-storage', 'bitbucket/internal/util/events', 'exports'], function ($, clientStorage, events, exports) {

    var historyKey;
    var viewedFiles;
    function initViewedState(diffTree) {
        initSubtreeViewedState(diffTree.$tree);
    }
    function initSubtreeViewedState($tree) {
        var $leafNodes = $tree.find('.jstree-leaf');
        $leafNodes.each(function (index, el) {
            var $el = $(el);
            var path = $el.data('path').toString;
            var contentId = $el.data('contentId');
            if (viewedFiles[path] === contentId) {
                $el.addClass('viewed');
            }
        });
    }
    function updateViewedState($node) {
        var path = $node.data('path').toString;
        var contentId = $node.data('contentId');
        if (viewedFiles[path] !== contentId) {
            viewedFiles[path] = contentId;
            clientStorage.setItem(historyKey, viewedFiles);
            $node.addClass('viewed');
        }
    }
    exports.init = function () {
        historyKey = clientStorage.buildKey('history', 'pull-request');
        viewedFiles = clientStorage.getItem(historyKey) || {};
        events.on('bitbucket.internal.feature.commit.difftree.treeInitialised', initViewedState);
        events.on('bitbucket.internal.feature.commit.difftree.nodeOpening', initSubtreeViewedState);
        events.on('bitbucket.internal.feature.commit.difftree.selectedNodeChanged', updateViewedState);
    };
    exports.reset = function () {
        historyKey = null;
        viewedFiles = null;
        events.off('bitbucket.internal.feature.commit.difftree.treeInitialised', initViewedState);
        events.off('bitbucket.internal.feature.commit.difftree.nodeOpening', initSubtreeViewedState);
        events.off('bitbucket.internal.feature.commit.difftree.selectedNodeChanged', updateViewedState);
    };
});