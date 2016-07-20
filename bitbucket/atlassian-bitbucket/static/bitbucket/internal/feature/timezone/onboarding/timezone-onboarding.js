'use strict';

define('bitbucket/internal/feature/timezone/onboarding', ['aui', 'aui/flag', 'jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/model/page-state', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/client-storage', 'bitbucket/internal/util/events', 'bitbucket/internal/util/feature-enabled', 'exports'], function (AJS, auiFlag, $, nav, pageState, ajax, clientStorage, events, featureEnabled, exports) {

    var OFFSET_STORAGE_KEY = 'bitbucket_known_time_zone_offset';
    var OFFSET_SETTING_KEY = 'USER_BROWSER_TIME_ZONE_OFFSET';

    /**
     * Is time zone onboarding enabled on the server?
     * getFromProvider is essentially synchronous even though there is a promise API,
     * so this should always resolve before the first MarkupAttachments is initialised.
     * If it doesn't, onboarding will default to being disabled.
     */
    var timeZoneOnboardingEnabled;
    featureEnabled.getFromProvider('user.time.zone.onboarding').done(function (enabled) {
        timeZoneOnboardingEnabled = enabled;
    });

    /**
     * Fires an event for analytics purposes
     *
     * @param {String} name the name of the event to fire
     */
    function analyticsEvent(name) {
        events.trigger('bitbucket.internal.ui.time.zone.onboarding.' + name);
    }

    /**
     * Event handler which redirects to the user account page.
     * Fires an analytics event and updates the user setting before redirecting.
     */
    function changeTimeZone() {
        analyticsEvent('changed');
        setKnownBrowserOffset().done(function () {
            exports.navigate(nav.newBuilder('account').build());
        });
    }

    function getBrowserOffsetAs(func) {
        return func(new Date().getTimezoneOffset());
    }

    /**
     * @returns {string|null} the known browser offset from local storage
     */
    function getLocalKnownBrowserOffset() {
        var knownBrowserOffset = clientStorage.getItem(OFFSET_STORAGE_KEY);
        return knownBrowserOffset ? String(knownBrowserOffset) : null;
    }

    /**
     * Will try to read the known offset value from the user settings REST endpoint.
     *
     * @returns {Promise<string>} a promise that resolves with the known browser offset
     */
    function getServerKnownBrowserOffset() {
        var user = pageState.getCurrentUser();
        if (user) {
            return ajax.rest({
                url: nav.rest().users(user.getSlug()).addPathComponents('settings').build(),
                type: 'GET',
                statusCode: {
                    '*': false // We don't ever want to show an error to the user when this fails
                }
            }).then(function (data) {
                var knownOffset = data[OFFSET_SETTING_KEY];
                saveOffset(knownOffset);
                if (knownOffset !== undefined && knownOffset !== null) {
                    return String(knownOffset);
                }
                return null;
            });
        }

        return $.Deferred().reject().promise();
    }

    function getServerOffsetAs(func) {
        return func($('#content').attr('data-timezone'));
    }

    /**
     * @param {string} knownBrowserOffset
     * @returns {boolean} true if the user's browser offset is not equal to the current browser offset.
     */
    function knownOffsetHasChanged(knownBrowserOffset) {
        return knownBrowserOffset !== getBrowserOffsetAs(String);
    }

    /**
     * Saves the offset to local storage
     * @param offset
     */
    function saveOffset(offset) {
        clientStorage.setItem(OFFSET_STORAGE_KEY, offset);
    }

    /**
     * Set the currently reported browser offset as the known offset.
     *
     * @returns {Promise} a promise that completes when the REST request completes (or fails)
     */
    function setKnownBrowserOffset() {
        var data = {};
        data[OFFSET_SETTING_KEY] = getBrowserOffsetAs(String);
        return ajax.rest({
            url: nav.rest().users(pageState.getCurrentUser().getSlug()).addPathComponents('settings').build(),
            type: 'POST',
            data: data,
            statusCode: {
                '*': false // We don't ever want to show an error to the user when this fails
            }
        }).done(function () {
            saveOffset(data[OFFSET_SETTING_KEY]);
        });
    }

    exports.navigate = function (href) {
        window.location.href = href;
    };

    exports.onReady = function () {
        if (timeZoneOnboardingEnabled) {
            if (getBrowserOffsetAs(Number) !== getServerOffsetAs(Number)) {
                if (knownOffsetHasChanged(getLocalKnownBrowserOffset())) {
                    return getServerKnownBrowserOffset() // Verify the Server agrees we should show the flag
                    .done(function (knownOffset) {
                        if (knownOffsetHasChanged(knownOffset)) {
                            analyticsEvent('shown');
                            var flag = auiFlag({
                                type: 'info',
                                close: 'manual',
                                title: AJS.I18n.getText('bitbucket.web.timezone.onboarding.title'),
                                body: bitbucket.internal.feature.timezone.onboarding.flagBody()
                            });

                            $('#time-zone-onboarding-change').one('click', changeTimeZone);
                            $('#time-zone-onboarding-dismiss').one('click', function () {
                                analyticsEvent('dismissed');
                                setKnownBrowserOffset().always(function () {
                                    flag.close();
                                });
                            });
                        }
                    });
                }
            }
        }
    };
});