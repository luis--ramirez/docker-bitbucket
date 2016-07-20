'use strict';

define('bitbucket/internal/page/maintenance/lock', ['aui', 'jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/layout/maintenance', 'bitbucket/internal/util/ajax', 'bitbucket/internal/widget/submit-spinner', 'exports'], function (AJS, $, nav, maintenance, ajax, SubmitSpinner, exports) {
    exports.onReady = function (hasToken) {
        var pollUrl = AJS.contextPath() + '/mvc/maintenance/lock';
        var cancelButtonId = 'cancel';
        var opts = {
            pollUrl: pollUrl,
            pollTickCallback: function pollTickCallback(progressBar, data, textStatus, xhr) {
                // always return undefined - never done until the pollUrl returns a 404
                return undefined;
            },
            cancelButtonId: cancelButtonId,
            redirectUrl: hasToken ? nav.admin().build() : nav.allProjects().build(),
            canceledHeader: AJS.I18n.getText('bitbucket.web.lock.canceled.title', bitbucket.internal.util.productName()),
            cancelingDescription: AJS.I18n.getText('bitbucket.web.lock.canceling.description', bitbucket.internal.util.productName()),
            hasCancelDialog: false
        };

        $('#' + cancelButtonId).on('click', function (event) {
            var $button = $(this);
            var $form = $button.closest('form');
            var $tokenField = $form.find('input[name=token]');
            var token = $tokenField.val();
            var spinner = new SubmitSpinner($button, 'after');

            spinner.show();

            // Can't use data() because jQuery sends the data as content body instead of query string parameters for
            // all non-GET requests. Encode the token into the query string of the url.
            ajax.rest({
                url: pollUrl + "?token=" + encodeURIComponent(token),
                type: 'DELETE',
                statusCode: {
                    409: function _(xhr, textStatus, errorThrown, resp) {
                        $tokenField.parent().replaceWith(bitbucket.internal.layout.maintenance.tokenInputField(resp));
                        return false;
                    },
                    '*': function _() {
                        return false;
                    }
                }
            }).always(function () {
                spinner.hide();
            }).done(function () {
                window.location = opts.redirectUrl;
            });

            event.preventDefault();
        });

        maintenance.init(opts);
    };
});