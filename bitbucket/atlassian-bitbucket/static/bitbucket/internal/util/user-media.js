'use strict';

define('bitbucket/internal/util/user-media', [], function () {
    // Normalise vendor prefixes
    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    return getUserMedia ? getUserMedia.bind(navigator) : undefined;
});