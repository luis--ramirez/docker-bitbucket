'use strict';

define('bitbucket/internal/feature/pull-request/pull-request-table', ['aui', 'aui/flag', 'jquery', 'lodash', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/pull-request', 'bitbucket/internal/util/events', 'bitbucket/internal/widget/paged-table'], function (AJS, auiFlag, $, _, pageState, PullRequest, events, PagedTable) {

    'use strict';

    PullRequestTable.defaults = {
        allFetchedMessageHtml: '<p class="no-more-results">' + AJS.I18n.getText('bitbucket.web.pullrequest.allfetched') + '</p>',
        alwaysDisplayRepositories: false,
        bufferPixels: 150,
        hideAuthorName: false,
        scope: 'repository',
        showStatus: false,
        target: "#pull-requests-table",
        container: "#pull-requests-table-container",
        tableMessageClass: "pull-request-table-message",
        paginationContext: 'pull-request-table',
        pageSize: 25
    };

    /**
     * Create a paged table of pull requests filled (after the first page) based on the supplied parameters
     * @param {String} prState only show pull requests in this state (defaults to open)
     * @param {String} prOrder the order to show the pull requests in either 'newest' or 'oldest' first
     * @param {Function} getPullRequestsUrlBuilder the function to get the base URL to find pull requests in
     * @param {Object} options additional options including:
     *                  - alwaysDisplayRepositories When true, ref lozenges will always include repository information.
     *                    When false, the source lozenge will show repository information if it doesn't match the target repository.
     *                  - direction the direction of the pull requests you want to display ('outgoing' or 'incoming'), used with source
     *                  - hideAuthorName toggles the rendering of the author name in addition to their avatar (defaults to true)
     *                  - scope options: repository (show id) [default]; global (repo)
     *                  - showStatus toggles the rendering of the status column, the status column will contain OPEN, MERGED or DECLINED lozenges
     *                  - source the branch to show pull requests for
    *                  - initialData JSON object of initial table data
     *                  - PagedTable options
     */
    function PullRequestTable(prState, prOrder, getPullRequestsUrlBuilder, options) {
        this.prState = prState && prState.toUpperCase();
        this.prOrder = prOrder ? prOrder : this.prState === PullRequest.state.OPEN ? 'oldest' : 'newest';
        this.getPullRequestsUrlBuilder = getPullRequestsUrlBuilder;
        this.prDirection = options.direction;
        this.prSource = options.source;

        var dynamicDefaults = {
            noneFoundMessageHtml: bitbucket.internal.feature.pullRequest.pullRequestTableEmpty({
                state: this.prState
            })
        };
        options = $.extend(PullRequestTable.defaults, dynamicDefaults, options);

        this.alwaysDisplayRepositories = options.alwaysDisplayRepositories;
        this.hideAuthorName = options.hideAuthorName;
        this.scope = options.scope;
        this.showStatus = options.showStatus;

        // if we've been passed initialData then render the initial table
        // client side
        if (options.initialData) {
            $(options.container).replaceWith(bitbucket.internal.feature.pullRequest.pullRequestTable({
                pullRequestPage: options.initialData,
                alwaysDisplayRepositories: options.alwaysDisplayRepositories,
                currentUser: pageState.getCurrentUser().toJSON()
            }));
        }

        PagedTable.call(this, options);

        var toolTipArgs = {
            hoverable: false,
            offset: 5,
            delayIn: 0,
            gravity: function gravity() {
                // Always position on screen
                return $.fn.tipsy.autoNS.call(this) + $.fn.tipsy.autoWE.call(this);
            },
            live: true
        };

        $(this.options.target).find('.author > div, .author .aui-avatar-inner > img').tooltip(toolTipArgs);
    }

    $.extend(PullRequestTable.prototype, PagedTable.prototype);

    /**
     * Returns the URL used to retrieve pull requests to fill the table based on the criteria supplied at construction
     * @param {number} index to start the page of pull requests at.
     * @param {number} number of pull requests to retrieve in this page.
     */
    PullRequestTable.prototype.buildUrl = function (start, limit) {
        var self = this;
        var builder = self.getPullRequestsUrlBuilder().withParams({
            start: start,
            limit: limit,
            avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'medium' }),
            withAttributes: true
        });

        if (self.prDirection) {
            builder = builder.withParams({
                direction: self.prDirection
            });
        }
        if (self.prSource) {
            builder = builder.withParams({
                at: self.prSource
            });
        }
        if (self.prState) {
            builder = builder.withParams({
                state: self.prState
            });
        }
        if (self.prOrder) {
            builder = builder.withParams({
                order: self.prOrder
            });
        }

        return builder.build();
    };

    PullRequestTable.prototype.focusInitialRow = function () {
        this.$table.find("tbody tr.pull-request-row:first").addClass("focused");
    };

    PullRequestTable.prototype.attachNewContent = function (data, attachmentMethod) {
        PagedTable.prototype.attachNewContent.call(this, data, attachmentMethod);

        events.trigger('bitbucket.internal.feature.pullRequestsTable.contentAdded', this, data);
    };

    PullRequestTable.prototype.handleNewRows = function (data, attachmentMethod) {
        var self = this;
        var rows = $(_.map(data.values, function (pr) {
            return bitbucket.internal.feature.pullRequest.pullRequestRow({
                alwaysDisplayRepositories: self.alwaysDisplayRepositories,
                currentUser: pageState.getCurrentUser().toJSON(),
                hideAuthorName: self.hideAuthorName,
                pullRequest: pr,
                scope: self.scope,
                showStatus: self.showStatus
            });
        }).join(''));
        this.$table.show().children("tbody")[attachmentMethod !== 'html' ? attachmentMethod : 'append'](rows);
    };

    PullRequestTable.prototype.initShortcuts = function () {
        var self = this;
        var sel = this.$table.selector;
        var openItemDisabled = false;
        var options = {
            "focusedClass": "focused",
            "wrapAround": false,
            "escToCancel": false
        };
        var focusedRowSelector = sel + " .pull-request-row." + options.focusedClass;
        var rowSelector = focusedRowSelector + ", " + //Always include the currently selected element, even if it's a filtered row
        sel + ":not(.filter-current-user, .filter-current-user-unactioned) .pull-request-row, " + //When not filtering pullrequests, include every row
        sel + ".filter-current-user .pull-request-row.current-user, " + //When filtering pullrequests by user, don't include non-reviewer rows
        sel + ".filter-current-user-unactioned .pull-request-row.current-user:not(.current-user-actioned)"; //When filtering pullrequests by user unactioned, don't include rows user has approved

        events.on('bitbucket.internal.keyboard.shortcuts.disableOpenItemHandler', function () {
            openItemDisabled = true;
        });
        events.on('bitbucket.internal.keyboard.shortcuts.enableOpenItemHandler', function () {
            openItemDisabled = false;
        });

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
                        window.location.href = $focusedItem.find('td.id a').attr('href');
                    }
                }
            });
        };

        this.bindHighlightAssignedHandler = function (keys) {
            (this.execute ? this : AJS.whenIType(keys)).execute(function () {
                rotateCurrentFilter(self.$table);
            });
        };

        var flag;
        function rotateCurrentFilter($el) {
            var filters = [{
                name: 'filter-current-user',
                description: AJS.I18n.getText('bitbucket.web.pullrequest.filter-current-user')
            }, {
                name: 'filter-current-user-unactioned',
                description: AJS.I18n.getText('bitbucket.web.pullrequest.filter-current-user-unactioned')
            }, {
                name: '',
                description: AJS.I18n.getText('bitbucket.web.pullrequest.filter-all')
            }];
            var lastFilterIndex = filters.length - 1;

            _.any(filters, function (filter, index) {
                if ($el.hasClass(filter.name) || index === lastFilterIndex) {
                    var newFilter = index < lastFilterIndex ? filters[index + 1] : filters[0];

                    $el.removeClass(filter.name).addClass(newFilter.name);
                    if (flag) {
                        flag.close();
                    }
                    flag = auiFlag({
                        type: 'info',
                        title: newFilter.description,
                        close: 'auto'
                    });
                    return true;
                }
                return false;
            });
        }

        PagedTable.prototype.initShortcuts.call(this);
    };

    return PullRequestTable;
});