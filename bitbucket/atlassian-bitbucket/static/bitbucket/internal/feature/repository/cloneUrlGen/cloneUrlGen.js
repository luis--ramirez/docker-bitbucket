'use strict';

define('bitbucket/internal/feature/repository/cloneUrlGen', ['jquery', 'lodash', 'unorm', 'bitbucket/util/navbuilder', 'bitbucket/internal/model/page-state', 'exports'], function ($, _, unorm, nav, pageState, exports) {

    function slugify(name) {
        return unorm.nfkd(name).replace(/[^\x00-\x7F]+/g, "").replace(/[^a-zA-Z\-_0-9\\.]+/g, "-").toLowerCase();
    }

    function bindUrlGeneration(el, options) {
        var $el = $(el);
        var defaults = {
            elementsToWatch: [],
            getProject: pageState.getProject.bind(pageState),
            getRepoName: _.constant('')
        };

        options = _.extend(defaults, options);
        var $elementsToWatch = options.elementsToWatch.reduce(function ($elements, el) {
            return $elements.add(el);
        }, $());

        $elementsToWatch.on("input change", function () {
            var slug = slugify(options.getRepoName());
            $el.text(slug && nav.project(options.getProject()).repo(slug).clone('git').buildAbsolute());
        }).trigger("change");
    }

    exports.bindUrlGeneration = bindUrlGeneration;
    exports.slugify = slugify;
});