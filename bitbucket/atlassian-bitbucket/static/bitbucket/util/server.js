'use strict';

/**
 * Provides functions for making requests to the server.
 * These functions will handle any generic error handling, such as server down, or session timed out, for you.
 *
 * NOTE: This module is highly dependent on the version of jQuery that is being used. We may upgrade jQuery at any time,
 * and this will affect the behavior of this module.
 *
 * **Web Resource:** com.atlassian.bitbucket.server.bitbucket-web-api:server
 *
 * @namespace bitbucket/util/server
 */
define('bitbucket/util/server', ['aui', 'jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/model/page-state', 'bitbucket/internal/util/error', 'bitbucket/internal/util/function', 'bitbucket/internal/widget/error-dialog', 'exports'],
/**
 * @exports bitbucket/util/server
 */
function (AJS, $, _, nav, pageState, errorUtil, fn, ErrorDialog, exports) {

    'use strict';

    $.ajaxSetup({
        timeout: 60000
    });

    var errorDialogIsOpen = false;

    function afterCountdown($countdownTimeHolder, intervalMs, endDate, afterCountdownFunc) {
        var now = new Date();

        if (now < endDate) {
            var onSecondsChanged = function onSecondsChanged() {
                var secondsLeft = Math.ceil((+endDate - +new Date()) / intervalMs);
                if (secondsLeft <= 0) {
                    clearInterval(intervalId);
                    afterCountdownFunc();
                } else {
                    $countdownTimeHolder.text(secondsLeft);
                }
            };
            var intervalId = setInterval(onSecondsChanged, intervalMs);

            onSecondsChanged();
        } else {
            afterCountdownFunc();
        }
    }

    function hideUntilCountdown($el, $replacementEl, $countdownTimeHolder, intervalMs, endDate) {
        var now = new Date();

        if (now < endDate) {
            $el.addClass('hidden');
            $el.before($replacementEl);

            afterCountdown($countdownTimeHolder, intervalMs, endDate, function () {
                $replacementEl.remove();
                $el.removeClass('hidden');
            });
        }
    }

    /**
     * Adds on global error handling to an ajax request.
     *
     * If the ajax request returns with global errors, they will be displayed to the user, and the xhr promise will be rejected.
     *
     * If the error is something that can be fixed with a retry, the error will be displayed, but the xhr promise will NOT be resolved or rejected.
     * Instead, progress callbacks will be called with 'stalled' as the argument. If the user attempts a retry, progress
     * callbacks will be called with 'unstalled' and the result of a retry request will be used to resolve or reject the original xhr promise.
     *
     * @private
     *
     * @param jqXhr - The ajax request to handle global errors for.
     * @param ajaxOptions - The options object used in the call to $.ajax.  These options are reused if the request needs to be retried.
     */
    function ajaxPipe(jqXhr, ajaxOptions, statusHandlers, isRest) {

        var pipedXhr;
        var latestXhr;
        var latestAbort;

        function updateLatest(jqXhr) {
            latestXhr = jqXhr;
            latestAbort = latestXhr.abort;
            latestXhr.abort = abort;
        }

        function abort() {
            latestAbort.apply(latestXhr, arguments);
        }

        function handleError(error, data, textStatus, jqXhr, errorThrown, ajaxOptions, isRest) {

            if (error.shouldLogin) {
                // Ideally at this point we want to run as little code as we can to redirect to the log in page ASAP
                // with as little interference as possible.
                window.onbeforeunload = null;
                window.location.href = nav.login().next(window.location.href).build();
                return $.Deferred(); // don't resolve|reject
            }

            if (data) {
                delete data.errors;
            }

            var errorDialog;
            if (!errorDialogIsOpen) {
                errorDialog = new ErrorDialog();
            }

            var deferredToReturn = error.shouldRetry && !errorDialogIsOpen ? $.Deferred() : $.Deferred().rejectWith(this, [jqXhr, textStatus, errorThrown, data, errorDialog]);

            if (!errorDialogIsOpen) {

                var extraPanelContent = '';
                var needsRetryCountdown = false;

                var errorHtml = bitbucket.internal.widget.errorContent(error);

                errorDialog.addHideListener(function () {
                    errorDialogIsOpen = false;
                });

                var dialogOptions = {
                    id: 'ajax-error',
                    titleText: error.title,
                    titleClass: error.titleClass || 'error-header',
                    showCloseButton: _.isUndefined(error.canClose) ? true : error.canClose,
                    closeOnOutsideClick: false
                };

                if (error.fallbackUrl) {
                    dialogOptions.okButtonText = AJS.escapeHtml(error.fallbackTitle);

                    errorDialog.addOkListener(function (e) {

                        window.location.href = error.fallbackUrl;

                        e.preventDefault();
                    });
                } else if (error.shouldReload) {
                    dialogOptions.okButtonText = AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.ajax.reload'));

                    errorDialog.addOkListener(function (e) {

                        window.location.reload();

                        e.preventDefault();
                    });
                } else if (error.shouldRetry) {
                    deferredToReturn.notify('stalled');

                    if (error.retryAfterDate) {

                        if (+error.retryAfterDate - +new Date() > 60 * 60 * 1000) {
                            extraPanelContent = AJS.I18n.getText('bitbucket.web.retry.later');
                        } else {
                            needsRetryCountdown = true;
                        }
                    }

                    dialogOptions.okButtonText = AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.ajax.try.again'));

                    var retryXhr;
                    errorDialog.addOkListener(function (e) {

                        deferredToReturn.notify('unstalled');

                        retryXhr = ajax(ajaxOptions, isRest);

                        errorDialog.remove();

                        updateLatest(retryXhr);

                        // pipe results from the retryXhr straight to the deferredToReturn
                        retryXhr.done(function () {
                            return deferredToReturn.resolveWith(this, arguments);
                        });
                        retryXhr.fail(function () {
                            return deferredToReturn.rejectWith(this, arguments);
                        });

                        e.preventDefault();
                    });

                    errorDialog.addHideListener(function () {
                        if (deferredToReturn.state() === 'pending' && !retryXhr) {
                            deferredToReturn.rejectWith(this, [jqXhr, textStatus, errorThrown, data]);
                        }
                    });
                } else {
                    // if the Ok button doesn't do anything but close the dialog, hide the second Close button.
                    dialogOptions.showCloseButton = false;
                }

                dialogOptions.panelContent = '<p>' + errorHtml + extraPanelContent + '</p>';

                errorDialog.reinit(dialogOptions).show();
                errorDialogIsOpen = true;

                if (needsRetryCountdown) {

                    var intervalMs;
                    var retryInHtml;
                    if (+error.retryAfterDate - +new Date() > 60 * 1000) {
                        retryInHtml = AJS.I18n.getText('bitbucket.web.retry.in.x.minutes', '<time><span></span>', '</time>');
                        intervalMs = 60 * 1000;
                    } else {
                        retryInHtml = AJS.I18n.getText('bitbucket.web.retry.in.x.seconds', '<time><span></span>', '</time>');
                        intervalMs = 1000;
                    }

                    var $retryMessage = $('<span>' + retryInHtml + '</span>');
                    var $intervalHolder = $retryMessage.children('time').children();
                    hideUntilCountdown(errorDialog.getOkButton(), $retryMessage, $intervalHolder, intervalMs, error.retryAfterDate);
                }
            }

            return deferredToReturn;
        }

        function xhrPipe(data, textStatus, jqXhr, errorThrown, customHandler, fallbackFunc) {

            var error = isRest ? errorUtil.getDominantRESTError(data, jqXhr) : errorUtil.getDominantAJAXError(jqXhr);
            var handleErrors = true;

            if (customHandler) {
                var ret = customHandler(error);

                // custom handler can return a deferred which will be piped through. We won't handle errors
                if (ret && typeof ret.promise === 'function') {
                    return ret.promise(jqXhr);
                }

                // custom handler can return a replacement error object which will replace the one we generate
                if (ret && _.isObject(ret)) {
                    error = ret;
                }

                // if the custom handler returns false, we won't handle errors,
                // and will simply fallback to normal behavior
                handleErrors = ret !== false;
            }

            if (handleErrors && error) {
                return handleError(error, data, textStatus, jqXhr, errorThrown, ajaxOptions, isRest);
            } else {
                return fallbackFunc();
            }
        }

        function getStatusHandler(status) {
            var customHandler = statusHandlers[status];
            if (customHandler === undefined || customHandler === null) {
                customHandler = statusHandlers['*'];
            }
            if (typeof customHandler === 'function') {
                return customHandler;
            } else {
                // Allow status handlers to be non-functions (ie false), which should always be returned
                return fn.constant(customHandler);
            }
        }

        function done(data, textStatus, jqXhr) {

            var self = this;

            var customHandler = getStatusHandler(jqXhr.status);
            var callCustomHandler = customHandler ? _.bind(customHandler, self, data, textStatus, jqXhr) : null;

            return xhrPipe(data, textStatus, jqXhr, null, callCustomHandler, function () {
                return $.Deferred().resolveWith(self, [data, textStatus, jqXhr]);
            });
        }

        function fail(jqXhr, textStatus, errorThrown) {

            var self = this;
            var data = jqXhr.responseText;

            try {
                data = JSON.parse(data);
            } catch (e) {/* ignore */}

            var customHandler = getStatusHandler(jqXhr.status);
            var callCustomHandler = customHandler ? _.bind(customHandler, self, jqXhr, textStatus, errorThrown, data) : null;

            return xhrPipe(data, textStatus, jqXhr, errorThrown, callCustomHandler, function () {
                return $.Deferred().rejectWith(self, [jqXhr, textStatus, errorThrown, data]);
            });
        }

        updateLatest(jqXhr);

        pipedXhr = jqXhr.then(done, fail);

        // return the original xhr, but with the piped done|fail|notify methods.
        return pipedXhr.promise(jqXhr);
    }

    /**
     * @private
     * @param {Object} options
     * @param {boolean} internalIsRest
     */
    function ajaxInternal(options, internalIsRest) {
        var statusHandlers;
        if (options.statusCode) {
            statusHandlers = options.statusCode;
            delete options.statusCode;
        }
        statusHandlers = statusHandlers || {};

        var xhr = ajaxPipe($.ajax(options), options, statusHandlers, internalIsRest);

        xhr.statusCode = function (map) {
            if (map) {
                if (xhr.state() === 'pending') {
                    $.extend(statusHandlers, map);
                } else {
                    for (var prop in map) {
                        if (map.hasOwnProperty(prop)) {
                            AJS.log('xhr.statusCode() should not be called after the request has completed. ' + 'Your handler will have no affect on the resolution of the request.');
                            break;
                        }
                    }

                    var tmp = map[xhr.status];
                    xhr.then(tmp, tmp);
                }
            }
        };

        return xhr;
    }

    /**
     * This function closely resembles the jQuery.ajax() function with a few notable exceptions.
     *
     * First, it only accepts the options signature - all options including `url` must be included on the options object.
     *
     * Second, it adds default error handling for all HTTP error codes and for cases where logged in state changes.
     *
     * Third, it overrides the `statusCode` option to allow you to specify your own error handling per-HTTP code.
     *
     * @memberOf bitbucket/util/server
     *
     * @example
     *
     * require('bitbucket/util/server').ajax({
     *     url : '/plugins/servlet/my-plugin'
     *     statusCode : {
     *         400 : false, // do not do any default handling for HTTP 400
     *         404 : function(xhr, textStatus, errorThrown, dominantError) {
     *             // return false; // do not handle this by default
     *             // return myDeferred.promise(); // resolve the request with my custom promise
     *             return { shouldReload : true }; // open a dialog requesting the user to reload the page.
     *         }
     *     }
     * });
     *
     * @param {Object} options - A map of option values. All options accepted by jQuery.ajax are accepted here.
     * @returns {jqXHR} - A jQuery XHR object.
     */
    function ajax(options) {
        return ajaxInternal(options);
    }

    /**
     * This function builds on {@link bitbucket/util/server.ajax} to add some defaults. It will:
     *
     * - Default the content type and Accept header to JSON (but this can be overridden).
     * - Add X-AUSERNAME and X-AUSERID headers for the current user, so the server knows which user we are attempting to make the request as.
     * - Stringify any JSON objects passed through the `data` option.
     * - Adds a fourth argument to the success handler that contains the JSON object parsed from the response body.
     * - Adds a fourth argument to the error handler that contains a description of how the error would have been handled by default.
     *
     * @memberOf bitbucket/util/server
     *
     * @example
     * require('bitbucket/util/server').rest({
     *     type : 'DELETE',
     *     url : '/rest/my-plugin/latest/things/1'
     *     statusCode : {
     *         404 : function() {
     *             return $.Deferred().resolve('Already deleted.');
     *         }
     *     }
     * });
     *
     * @param {Object} options - See {@link bitbucket/util/server.ajax} for a description of the accepted options.
     * @returns {jqXHR} - A jQuery XHR object.
     */
    function rest(options) {
        var headers = {};
        if (pageState.getCurrentUser()) {
            headers['X-AUSERNAME'] = pageState.getCurrentUser().getName();
            headers['X-AUSERID'] = pageState.getCurrentUser().getId();
        }
        options = $.extend(true, {
            dataType: 'json',
            contentType: 'application/json',
            headers: headers,
            jsonp: false,
            type: "GET"
        }, options);

        if (options.type.toUpperCase() !== 'GET' && ($.isPlainObject(options.data) || $.isArray(options.data))) {
            options.data = JSON.stringify(options.data);
        }

        return ajaxInternal(options, true);
    }

    /**
     * This function builds on {@link rest} by adding polling. You can use it to make a request repeatedly, until
     * a "finished" response is returned. This is useful, for example, when waiting for the server to complete a background task
     * like deleting a repository or waiting for maintenance to complete.
     *
     * @memberOf bitbucket/util/server
     *
     * @example
     *
     * require('bitbucket/util/server').poll({
     *     url : '/plugin/servlet/expensive-task-checker',
     *     tick : function(data, textStatus, xhr) {
     *         if (data.expensiveTaskComplete) {
     *             return true; // success
     *         }
     *         if (data.expensiveTaskAborted) {
     *             return false; // failure
     *         }
     *         // return undefined; // keep polling. return undefined is implied.
     *     }
     * });
     *
     * @param {Object} options - See {@link bitbucket/util/server.rest} for the options accepted.
     * @param {number|boolean} [options.pollTimeout=60000] - The number of milliseconds to poll before ending the poll
     *                                                       as a failure. May pass `false` to indicate no timeout.
     * @param {number} [options.interval=500] - The number of milliseconds between each AJAX response and subsequent request.
     * @param {number} [options.delay=0] - The number of milliseconds before the first AJAX call.
     * @param {Function} options.tick - A function to call with each AJAX response's callback parameters.
     *                                  It should return `truthy` to end polling successfully, `undefined`
     *                                  to continue polling, or `falsy` to end polling as a failure.
     * @returns {Promise} A jQuery Promise with added pause() and resume() methods.
     */
    function poll(options) {
        options = $.extend({
            pollTimeout: 60000,
            interval: 500,
            delay: 0,
            tick: $.noop
        }, options);
        var paused = false;
        var polling = false;
        var defer = $.Deferred();
        var startTime = Date.now();
        var doPoll = function doPoll() {
            // Short circuit if the poller is paused or if it is already polling
            if (paused || polling) {
                return;
            }
            polling = true;
            rest(options).done(function (data, textStatus, xhr) {
                var isDone = options.tick(data, textStatus, xhr);
                if (isDone) {
                    defer.resolveWith(this, [data, textStatus, xhr]);
                } else if (options.pollTimeout !== false && Date.now() - startTime > options.pollTimeout || typeof isDone !== 'undefined') {
                    defer.rejectWith(this, [xhr, textStatus, null, data]);
                } else {
                    setTimeout(doPoll, options.interval);
                }
            }).fail(function (xhr, textStatus, errorThrown, data) {
                defer.rejectWith(this, [xhr, textStatus, errorThrown, data]);
            }).always(function () {
                polling = false;
            });
        };
        setTimeout(doPoll, options.delay);
        var promise = defer.promise();
        promise.resume = function () {
            if (paused) {
                paused = false;
                doPoll();
            }
        };
        promise.pause = function () {
            paused = true;
        };
        return promise;
    }

    exports.ajax = ajax;
    exports.rest = rest;
    exports.poll = poll;
});