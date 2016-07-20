define('aui', [
    'bitbucket/internal/util/feature-enabled'
], function (
    featureEnabled
) {
    window.AJS.DarkFeatures = {
        isEnabled: featureEnabled.getFromProviderSync,

        enable: function (key) {
            // Noop
        },

        disable: function (key) {
            // Noop
        }
    };
    return window.AJS;
});
