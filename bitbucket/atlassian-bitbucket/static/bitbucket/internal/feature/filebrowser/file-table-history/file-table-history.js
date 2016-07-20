'use strict';

define('bitbucket/internal/feature/filebrowser/file-table-history', ['jquery', 'lodash', 'bitbucket/util/events', 'bitbucket/util/navbuilder', 'bitbucket/util/server', 'bitbucket/internal/model/page-state', 'bitbucket/internal/util/analytics', 'bitbucket/internal/util/parse-commit-message', 'exports'], function ($, _, events, nav, server, pageState, analytics, parseCommitMessage, exports) {
    'use strict';

    var lastHistoryRequest;
    var lastRequestStart;

    function abortLastRequest() {
        if (lastHistoryRequest) {
            lastHistoryRequest.abort();
        }
    }

    function updateHistory() {
        abortLastRequest();

        var ref = pageState.getRevisionRef();
        var commitId = ref.isCommit() ? ref.getId() : ref.getLatestCommit();
        var pathComponents = pageState.getFilePath().getComponents();

        lastHistoryRequest = server.rest({
            url: nav.rest().currentRepo().lastModified().path(pathComponents).at(commitId).build(),
            statusCode: {
                404: false,
                500: false,
                0: function _(xhr, statusText) {
                    if (statusText === 'timeout') {
                        analytics.add('filetable.lastmodified.timeout');
                        return false;
                    }

                    if (statusText === 'abort') {
                        analytics.add('filetable.lastmodified.aborted', {
                            requestTime: Date.now() - lastRequestStart
                        });
                        return false;
                    }
                }
            }
        }).done(function (history) {
            analytics.add('filetable.lastmodified.succeeded', {
                //Only care about the request time, not the render time (below)
                requestTime: Date.now() - lastRequestStart
            });

            var $fileBrowserTable = $('.filebrowser-table');

            // only display latest commit message on files, not directories
            $fileBrowserTable.find('tr.file').each(function () {
                var $fileRow = $(this);
                var fileName = $fileRow.data('item-name');
                var commit = history.files[fileName];
                if (!commit) {
                    return;
                }
                var fileUrl = nav.currentRepo().commit(commit.id).withFragment(pathComponents.concat(fileName).join('/')).build();

                commit.shortMessage = parseCommitMessage.splitIntoSubjectAndBody(commit.message).subject;
                $fileRow.append(bitbucket.internal.widget.filetablehistory.row({
                    commit: commit,
                    fileUrl: fileUrl
                }));
                $fileRow.find('.item-name').removeAttr('colspan');
            });
            _.defer(function () {
                // this is sad, but it turns out you cannot add and animate an element in the same JS round
                // using a timeout to trigger the proper animation :(
                $fileBrowserTable.find('td.hide').removeClass('hide');
            });
        }).always(function () {
            lastHistoryRequest = null;
            lastRequestStart = null;
        });
        lastRequestStart = Date.now();
    }

    exports.init = function () {
        events.on('bitbucket.internal.feature.filebrowser.filesChanged', updateHistory);
        events.on('bitbucket.internal.feature.filefinder.unloaded', updateHistory);
        events.on('bitbucket.internal.feature.filefinder.loaded', abortLastRequest);
    };
});