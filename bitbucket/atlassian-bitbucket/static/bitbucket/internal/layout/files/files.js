'use strict';

define('bitbucket/internal/layout/files', ['bitbucket/internal/model/page-state', 'bitbucket/internal/model/path', 'bitbucket/internal/model/revision-reference', 'bitbucket/internal/util/events', 'bitbucket/internal/widget/breadcrumbs', 'exports'], function (pageState, Path, RevisionReference, events, Breadcrumbs, exports) {

    exports.onReady = function (pathComponents, atRevision, breadcrumbsSelector, isDirectory) {

        pageState.setFilePath(new Path(pathComponents));

        var currentRevisionRef = new RevisionReference(atRevision);
        var breadcrumbs = new Breadcrumbs(breadcrumbsSelector);

        events.on('bitbucket.internal.widget.breadcrumbs.urlChanged', function (url) {
            if (this === breadcrumbs) {
                events.trigger('bitbucket.internal.layout.files.urlChanged', this, url);
            }
        });

        /* React to page changes */
        events.on('bitbucket.internal.page.*.revisionRefChanged', function (revisionReference) {
            currentRevisionRef = RevisionReference.hydrateDeprecated(revisionReference);
            breadcrumbs.update(currentRevisionRef, new Path(pageState.getFilePath()), isDirectory);
        });

        events.on('bitbucket.internal.page.*.pathChanged', function (path) {
            path = new Path(path);
            pageState.setFilePath(path);
            breadcrumbs.update(currentRevisionRef, path, isDirectory);
            // For now, isDirectory won't change when path changes cause we don't have push-state
        });
    };
});