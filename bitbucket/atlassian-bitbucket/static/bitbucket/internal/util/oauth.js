'use strict';

define('bitbucket/internal/util/oauth', ['jquery', 'bitbucket/internal/util/events'], function ($, events) {

    'use strict';

    /**
     * Applinks uses a pair of global variables to communicate for client OAuth requests.
     * - oauthCallback is an object whose success and failure properties are callbacks for the authorization.
     * - aouthWindow(sic) is a reference to the window we opened to do the oauth request.
     *
     * This object encapsulates those inner workings, and exposes fireRequest to attempt to get authorization for a url
     * and cancelRequest to cancel that attempt (if it is still running)
     *
     * Note that since we're using global variables, only one request may be open at a time.
     */

    var applinksWTF = function () {
        function reset() {
            if (window.aouthWindow && window.aouthWindow.close) {
                window.aouthWindow.close();
            }
            window.oauthCallback = null;
            window.aouthWindow = null;
        }

        function fireRequest(url, _success, _failure) {
            window.oauthCallback = {
                uri: url,
                success: function success() {
                    reset();

                    if (_success) {
                        _success();
                    }
                },
                failure: function failure() {
                    reset();

                    if (_failure) {
                        _failure();
                    }
                }
            };
            window.aouthWindow = window.open(url);
        }

        function cancelRequest(url) {
            if (window.oauthCallback && window.oauthCallback.uri === url) {
                window.oauthCallback.failure();
            }
        }

        return {
            fireRequest: fireRequest,
            cancelRequest: cancelRequest
        };
    }();

    /**
     * Fire a request with applinks. Return a useful API, and fire events when the state of the request changes.
     * @param url {String} The authorization URL provided by AppLinks - likely from a CredentialsRequiredException.
     * @return {{url: *, deferred: $.Deferred, api: { then : function(), abort : function() } }}
     */
    function fireRequest(url) {
        var deferred = new $.Deferred();
        var request = {
            url: url,
            deferred: deferred,
            api: deferred.promise({
                abort: function abort() {
                    applinksWTF.cancelRequest(url);
                }
            })
        };

        events.trigger('bitbucket.internal.util.oauth.authorizationRequested', null, url);
        deferred.then(function success() {
            events.trigger('bitbucket.internal.util.oauth.authorizationSucceeded', null, url);
        }, function failure() {
            events.trigger('bitbucket.internal.util.oauth.authorizationFailed', null, url);
        });

        applinksWTF.fireRequest(url, deferred.resolve, deferred.reject);

        return request;
    }

    var currentRequest;

    /**
     * Request OAuth authorization for a particular OAuth  authorization url.
     * Check that only one request is active at a time, and cancel any previous requests that are pending.
     * @param url {String} The authorization URL provided by AppLinks - likely from a CredentialsRequiredException.
     * @return {{ then : function(), abort : function() }}
     */
    function authorizeUrl(url) {
        if (currentRequest) {
            if (currentRequest.url === url) {
                return currentRequest.api;
            }

            currentRequest.api.abort();
        }

        currentRequest = fireRequest(url);
        var request = currentRequest;
        currentRequest.deferred.always(function () {
            // NOTE: Be careful. This callback could run synchronously or asynchronously.
            currentRequest = null;
        });

        return request.api;
    }

    /**
     * Intercept clicks on links matching a selector, and use the value of the link's
     * href attribute as the authorization URL for an OAuth request.
     * @param selector {String} a jQuery selector to use for matching authorization links.
     */
    function interceptLinks(selector) {
        $(document).on('click', selector, function (e) {
            var url = this.getAttribute('href');
            if (url) {
                authorizeUrl(url);
                e.preventDefault();
            }
        });
    }

    return {
        authorizeUrl: authorizeUrl,
        interceptLinks: interceptLinks
    };
});