'use strict';

define('bitbucket/internal/page/repository/emptyRepository', ['aui', 'jquery', 'bitbucket/util/state', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/events', 'exports'], function (AJS, $, pageStateApi, ajax, events, exports) {

    function updateInstructions(module, cloneUrl) {
        $('#empty-repository-instructions').html(bitbucket.internal.page.emptyRepositoryInstructions({
            repository: pageStateApi.getRepository(),
            cloneUrl: cloneUrl,
            currentUser: pageStateApi.getCurrentUser()
        }));
    }

    events.on('bitbucket.internal.feature.repository.clone.protocol.initial', updateInstructions);
    events.on('bitbucket.internal.feature.repository.clone.protocol.changed', updateInstructions);

    exports.onReady = function (notInitialised) {
        if ($('#empty-repository-instructions:empty').length) {
            updateInstructions(null, pageStateApi.getRepository().cloneUrl);
        }

        if (notInitialised) {
            var browse = "/browse";
            var i = window.location.href.lastIndexOf(browse);
            var pollUrl = i === -1 ? window.location.href : window.location.href.substr(0, i);
            var $initialisingContainer = $('<div id="initialising" />');
            var $initialisingMessage = $('<h2></h2>');
            var $page = $('#content .content-body');
            $initialisingMessage.text(AJS.I18n.getText('bitbucket.web.repository.initialising'));

            $page.css('opacity', 0.2);

            $initialisingMessage.appendTo($initialisingContainer);
            $initialisingContainer.appendTo($page.parent());
            $initialisingContainer.spin('large');
            ajax.poll({
                url: pollUrl,
                tick: function tick(data) {
                    var state = data && data.state;
                    if (state === 'AVAILABLE') {
                        return true;
                    } else if (state === 'INITIALISATION_FAILED') {
                        return false;
                    } else {
                        return undefined;
                    }
                }
            }).always(function () {
                $initialisingContainer.spinStop();
                $initialisingContainer.remove();
                $page.fadeTo('fast', 1);
            }).fail(function (xhr, statusText, something, repo) {
                $page.empty().css('padding', '16px');
                if (xhr.status === 200) {
                    $(aui.message.error({ content: AJS.escapeHtml(repo.statusMessage) })).appendTo($page);
                }
            });
        }
    };
});

require('bitbucket/internal/page/repository/emptyRepository');