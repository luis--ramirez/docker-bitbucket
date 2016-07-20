'use strict';

define('bitbucket/internal/feature/watch', ['aui', 'jquery', 'lodash', 'bitbucket/internal/model/page-state', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/events'], function (AJS, $, _, pageState, ajax, events) {

    'use strict';

    var types = {
        COMMIT: 'commit',
        PULL_REQUEST: 'pull-request'
    };

    function Watch($watchButton, url, watchableType) {
        var self = this;
        this.url = url;
        this.$watch = $watchButton;
        this.isWatching = pageState.getIsWatching();
        this.watchableType = watchableType;

        this.$watch.on('click', triggerClicked);

        _.bindAll(this, 'toggleWatch', 'toggleUnwatch', 'toggleTrigger');

        function triggerClicked(e, additionalOptions) {
            e.preventDefault();

            var newState = !self.isWatching; // newState is optimistic
            self.toggleTrigger(newState);

            return ajax.rest({
                url: self.url,
                type: self.isWatching ? 'DELETE' : 'POST',
                statusCode: {
                    '401': function _(xhr, textStatus, errorThrown, errors, dominantError) {
                        return $.extend({}, dominantError, {
                            title: AJS.I18n.getText('bitbucket.web.watch.default.error.401.title'),
                            message: AJS.I18n.getText('bitbucket.web.watch.default.error.401.message'),
                            fallbackUrl: false,
                            shouldReload: true
                        });
                    },
                    '409': function _(xhr, textStatus, errorThrown, errors, dominantError) {
                        return $.extend({}, dominantError, {
                            title: AJS.I18n.getText('bitbucket.web.watch.default.error.409.title'),
                            fallbackUrl: false,
                            shouldReload: true
                        });
                    }
                }
            }).done(function () {
                self.isWatching = newState;
                pageState.setIsWatching(newState);
                var eventName = self.isWatching ? 'bitbucket.internal.web.watch-button.added' : 'bitbucket.internal.web.watch-button.removed';
                var options = $.extend({ watched: self.isWatching }, additionalOptions);
                events.trigger(eventName, self, options);
            }).fail(function () {
                self.toggleTrigger(self.isWatching); // Revert trigger to actual state
            });
        }
    }

    /**
     * Sets the isWatching state and sets the trigger label text
     * @param isWatching
     */
    Watch.prototype.setIsWatching = function (isWatching) {
        this.toggleTrigger(isWatching);
        this.isWatching = isWatching;
        if (pageState.getIsWatching() !== isWatching) {
            pageState.setIsWatching(isWatching);
        }
    };

    Watch.prototype.toggleWatch = function () {
        this.toggleTrigger(true);
    };

    Watch.prototype.toggleUnwatch = function () {
        this.toggleTrigger(false);
    };

    /**
     * Toggles the label text for the watching trigger. Does not change isWatching state.
     * @param isWatching - If true, label will be "Unwatch ..". If false, label will be "Watch .."
     */
    Watch.prototype.toggleTrigger = function (isWatching) {
        var triggerHtml;

        switch (this.watchableType) {
            case Watch.type.COMMIT:
                triggerHtml = bitbucket.internal.feature.watch.commitLabel({ isWatching: isWatching });
                break;
            case Watch.type.PULL_REQUEST:
                triggerHtml = bitbucket.internal.feature.watch.pullRequestLabel({ isWatching: isWatching });
                break;
        }

        this.$watch.fadeOut(200, function () {
            $(this).html(triggerHtml).fadeIn(200);
        });
    };

    Watch.prototype.destroy = function () {
        this.url = null;
        this.$watch = null;
        this.isWatching = null;
    };

    Watch.type = types;

    return Watch;
});