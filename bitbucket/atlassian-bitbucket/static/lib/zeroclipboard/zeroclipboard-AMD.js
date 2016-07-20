define('zero-clipboard', [
    'aui'
], function(
    AJS
) {
    var ZeroClipboard = window.ZeroClipboard;
    ZeroClipboard.config({
        swfPath: AJS.contextPath() + '/s/' + ZeroClipboard.version + '/_/download/resources/com.atlassian.bitbucket.server.bitbucket-bower-components:zeroclipboard/ZeroClipboard.swf',
        cacheBust: false
    });
    return ZeroClipboard;
});
