'use strict';

define('bitbucket/internal/impl/analytics', ['aui', 'bitbucket/internal/bbui/analytics/analytics', 'bitbucket/internal/util/object'], function (AJS, AnalyticsSPI, obj) {
    'use strict';

    function Analytics() {
        AnalyticsSPI.call(this);
    }

    obj.inherits(Analytics, AnalyticsSPI);

    Analytics.prototype.trigger = function (eventName, eventAttributes) {
        var payload = {
            name: eventName,
            data: eventAttributes
        };

        AJS.trigger('analytics', payload);
    };

    return new Analytics();
});