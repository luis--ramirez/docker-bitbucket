'use strict';

define('bitbucket/internal/widget/breadcrumbs', ['jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/model/page-state', 'bitbucket/internal/util/dom-event', 'bitbucket/internal/util/events'], function ($, _, nav, pageState, domEventUtil, events) {

    'use strict';

    function Breadcrumbs(containerSelector) {
        this.$container = $(containerSelector);
        var self = this;
        this.$container.on('click', 'a', function (e) {
            if (domEventUtil.openInSameTab(e)) {
                events.trigger('bitbucket.internal.widget.breadcrumbs.urlChanged', self, $(this).attr("href"));
                e.preventDefault();
            }
        });
    }

    var browseNavBuilder = nav.currentRepo().browse();
    var browsePath = function browsePath(pathComponents, revisionReference) {
        if (!revisionReference.isDefault()) {
            return browseNavBuilder.path(pathComponents).at(revisionReference.getId()).build();
        } else {
            return browseNavBuilder.path(pathComponents).build();
        }
    };

    function createBreadcrumbData(revisionReference, pathComponents) {
        var pathSeed = [];
        var breadcrumbParts = _.map(pathComponents, function (part) {
            pathSeed = pathSeed.slice(0); //shallow copy
            pathSeed.push(part);
            return {
                text: part,
                url: browsePath(pathSeed, revisionReference)
            };
        });

        //prepend repository link
        breadcrumbParts.unshift({
            text: pageState.getRepository().getName(),
            url: browsePath([], revisionReference)
        });

        return breadcrumbParts;
    }

    Breadcrumbs.prototype.update = function (revisionReference, path, isDirectory) {
        this.$container.empty().append(bitbucket.internal.widget.breadcrumbs.crumbs({
            'pathComponents': createBreadcrumbData(revisionReference, path.getComponents()),
            'trailingSlash': isDirectory
        }));
    };

    return Breadcrumbs;
});