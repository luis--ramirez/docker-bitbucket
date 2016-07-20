'use strict';

define('bitbucket/internal/feature/commits/commits-table', ['aui', 'aui/flag', 'jquery', 'lodash', 'bitbucket/internal/util/events', 'bitbucket/internal/widget/paged-table'], function (AJS, auiFlag, $, _, events, PagedTable) {

    function CommitTable(getCommitsUrlBuilder, options) {
        this.getCommitsUrlBuilder = getCommitsUrlBuilder;

        var defaults = {
            target: "#commits-table",
            ajaxDataType: 'html',
            tableMessageClass: 'commits-table-message',
            allFetchedMessageHtml: '<p class="no-more-results">' + AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.commit.allcommitsfetched')) + '</p>',
            noneFoundMessageHtml: '<h3 class="no-results entity-empty">' + AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.commit.nocommitsfetched')) + '</h3>',
            paginationContext: 'commits-table'
        };
        options = $.extend({}, defaults, options);

        PagedTable.call(this, options);

        this.$spinner.addClass('commits-table-spinner');
        this._destroyables = [];
    }

    $.extend(CommitTable.prototype, PagedTable.prototype);

    CommitTable.prototype.buildUrl = function (start, limit) {
        return this.getCommitsUrlBuilder().withParams({
            start: start,
            limit: limit,
            contents: ''
        }).build();
    };

    CommitTable.prototype.onDataLoaded = function (start, limit, data) {
        if (typeof data === 'string') {
            // real ajax request
            data = this.createDataFromJQuery(start, limit, $(data));
        }
        return PagedTable.prototype.onDataLoaded.call(this, start, limit, data);
    };

    CommitTable.prototype.attachNewContent = function (data, attachmentMethod) {
        PagedTable.prototype.attachNewContent.call(this, data, attachmentMethod);

        events.trigger('bitbucket.internal.widget.commitsTable.contentAdded', this, data);
    };

    CommitTable.prototype.handleNewRows = function (data, attachmentMethod) {
        this.$table.show().children("tbody")[attachmentMethod !== 'html' ? attachmentMethod : 'append'](data.values);
    };

    CommitTable.prototype.focusInitialRow = function () {
        this.$table.find("tbody tr.commit-row:first").addClass("focused-commit");
    };

    CommitTable.prototype.bindKeyboardShortcuts = function () {
        var self = this;
        var sel = this.$table.selector;
        var openItemDisabled = false;
        var options = {
            "focusedClass": "focused-commit",
            "wrapAround": false,
            "escToCancel": false
        };
        var focusedRowSelector = sel + " .commit-row." + options.focusedClass;
        var rowSelector = focusedRowSelector + ", " + //Always include the currently selected element, even if it's a filtered merge row
        sel + ".show-merges .commit-row, " + //When not filtering merges, include every row
        sel + ":not(.show-merges) .commit-row:not(.merge)"; //When filtering merges, don't include merge rows

        this._onDisableOpenItemHandler = function () {
            openItemDisabled = true;
        };
        this._onEnableOpenItemHandler = function () {
            openItemDisabled = false;
        };
        this.bindMoveToNextHandler = function (keys) {
            (this.moveToNextItem ? this : AJS.whenIType(keys)).moveToNextItem(rowSelector, options).execute(function () {
                if ($(rowSelector).last().hasClass(options.focusedClass)) {
                    window.scrollTo(0, document.documentElement.scrollHeight);
                }
            });
        };

        this.bindMoveToPreviousHandler = function (keys) {
            (this.moveToPrevItem ? this : AJS.whenIType(keys)).moveToPrevItem(rowSelector, options);
        };

        this.bindOpenItemHandler = function (keys) {
            (this.execute ? this : AJS.whenIType(keys)).execute(function () {
                if (!openItemDisabled) {
                    var $focusedItem = jQuery(focusedRowSelector);
                    if ($focusedItem.length) {
                        window.location.href = $focusedItem.find('td.commit a').attr('href');
                    }
                }
            });
        };

        this.bindToggleMergesHandler = function (keys) {
            var flag;
            (this.execute ? this : AJS.whenIType(keys)).execute(function () {
                self.$table.toggleClass("show-merges");
                var showingMerges = self.$table.hasClass("show-merges");
                var title = showingMerges ? AJS.I18n.getText('bitbucket.web.commit.filter-all') : AJS.I18n.getText('bitbucket.web.commit.filter-hide-merge');
                if (flag) {
                    flag.close();
                }
                flag = auiFlag({
                    type: 'info',
                    title: title,
                    close: 'auto'
                });
            });
        };

        this._destroyables.push(events.chain().on('bitbucket.internal.keyboard.shortcuts.requestMoveToNextHandler', this.bindMoveToNextHandler).on('bitbucket.internal.keyboard.shortcuts.requestMoveToPreviousHandler', this.bindMoveToPreviousHandler).on('bitbucket.internal.keyboard.shortcuts.requestOpenItemHandler', this.bindOpenItemHandler).on('bitbucket.internal.keyboard.shortcuts.requestToggleMergesHandler', this.bindToggleMergesHandler).on('bitbucket.internal.keyboard.shortcuts.disableOpenItemHandler', this._onDisableOpenItemHandler).on('bitbucket.internal.keyboard.shortcuts.enableOpenItemHandler', this._onEnableOpenItemHandler));
        this._destroyables.push(PagedTable.prototype.initShortcuts.call(this));
    };
    CommitTable.prototype.destroy = function () {
        PagedTable.prototype.destroy.call(this);
        _.invoke(this._destroyables, 'destroy');
    };

    return CommitTable;
});