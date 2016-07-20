define('bacon', [
    'jquery'
], function (
    $
) {
    // Check module just in case we're running in QUnit
    var Bacon = window.Bacon || window.module.exports;
    $.fn.asEventStream = Bacon.$.asEventStream;
    return Bacon;
});
