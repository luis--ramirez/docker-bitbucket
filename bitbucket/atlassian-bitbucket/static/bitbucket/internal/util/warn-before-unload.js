'use strict';

define('bitbucket/internal/util/warn-before-unload', ['aui'], function (AJS) {

    'use strict';

    /**
     * Wrap this function around a promise and the user will be presented with a message and a confirmation box
     * if they attempt to close the window before the promise is resolved or rejected.
     *
     * @param {Object} promise the promise to wrap.
     * @param {String} message a string to present when the window is closing.  Avoid asking a question - the browser will add one.
     */

    function warnBeforeUnload(promise, message) {
        var completed = false;

        message = message || AJS.I18n.getText('bitbucket.web.warnonunload', bitbucket.internal.util.productName());

        var oldOnBeforeUnload = window.onbeforeunload;
        var newOnBeforeUnload = function newOnBeforeUnload() {

            var oldRet = oldOnBeforeUnload ? oldOnBeforeUnload.apply(this, arguments) : undefined;

            return completed ? oldRet : message;
        };

        window.onbeforeunload = newOnBeforeUnload;

        promise.always(function () {
            completed = true;
            if (window.onbeforeunload === newOnBeforeUnload) {
                //someone might have beaten us
                window.onbeforeunload = oldOnBeforeUnload;
            }
        });
    }

    return warnBeforeUnload;
});