'use strict';

require(['aui', 'jquery', 'bitbucket/util/navbuilder', 'bitbucket/util/server'], function (AJS, $, nav, server) {
    'use strict';

    var commitCache = {};

    function truncateCommitMessage(commitMessage) {
        //Truncate long commit messages to ~750 characters (break on the first whitespace character AFTER the 750th character)
        var truncated = commitMessage.substring(0, commitMessage.substring(750).search(/\s/) + 750);
        return truncated.length < commitMessage.length ? truncated + '…' : truncated;
    }

    function refreshTipsy($el) {
        if ($el.data('tipsy').hoverState === "in") {
            $el.tipsy('hide');
            $el.tipsy('show');
        }
    }

    $(function () {
        $('a.commitid:not(.no-preview), .commit-preview-trigger').tipsy({
            live: true,
            opacity: 0.98,
            gravity: function gravity() {
                // Always position on screen
                return $.fn.tipsy.autoNS.call(this) + $.fn.tipsy.autoWE.call(this);
            },
            className: 'commit-preview-tipsy',
            title: function title() {
                var $this = $(this);
                var commitMessage = $this.data('commit-message');
                if (commitMessage) {
                    return truncateCommitMessage(commitMessage);
                }
                var commitId = $this.attr("data-commitid") || $this.text();

                if (commitCache.hasOwnProperty(commitId)) {
                    return commitCache[commitId];
                }

                var paramsRegex = /.*?\/(projects|users)\/([^\/]+)\/repos\/([^\/]+)\//;
                var matches = nav.parse($this.attr('href')).path().match(paramsRegex);
                var url;

                if (matches) {
                    var projectKey = (matches[1] === 'users' ? '~' : '') + matches[2];
                    url = nav.rest().project(projectKey).repo(matches[3]).commit(commitId).build();
                } else {
                    //fallback to using the currentRepo
                    url = nav.rest().currentRepo().commit(commitId).build();
                }

                //request the data, return placeholder
                server.rest({
                    url: url,
                    statusCode: {
                        404: function _(xhr, statusText, errorThrown, data, error) {
                            commitCache[commitId] = error.message;
                            return false;
                        }
                    }
                }).done(function (commit) {
                    commitCache[commitId] = truncateCommitMessage(commit.message);
                }).always(refreshTipsy.bind(null, $this));

                return AJS.I18n.getText('bitbucket.web.commit.preview.loading');
            }
        });
    });
});