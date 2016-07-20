define('fd-slider', [
    'bitbucket/internal/util/deprecation'
], function(
    deprecate
) {

    "use strict";

    var updateSlider = window.fdSlider.updateSlider;
    var onDomReady = window.fdSlider.onDomReady;

    deprecate.obj(window.fdSlider, 'fdSlider', null, '3.7', '4.0');

    // versions we can use until IE9 is deprecated without creating log spam.
    window.fdSlider._deprecatedUpdateSlider = updateSlider;
    window.fdSlider._deprecatedOnDomReady = onDomReady;

    return window.fdSlider;
});
