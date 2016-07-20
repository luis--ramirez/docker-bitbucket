'use strict';

define('bitbucket/internal/feature/pull-request/can-merge', ['bitbucket/internal/util/events'], function (events) {

    function canMerge() {
        events.trigger('bitbucket.internal.feature.pull-request.merge-check');
    }

    return canMerge;
});