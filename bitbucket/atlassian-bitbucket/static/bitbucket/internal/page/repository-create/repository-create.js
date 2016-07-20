'use strict';

define('bitbucket/internal/page/repository-create', ['jquery', 'bitbucket/internal/feature/repository/cloneUrlGen', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/project', 'exports'], function ($, cloneUrlGen, pageState, Project, exports) {
    exports.onReady = function (projectJSON) {
        pageState.setProject(new Project(projectJSON));

        var $repoName = $("#name");
        var $cloneUrl = $(".clone-url-generated span");
        cloneUrlGen.bindUrlGeneration($cloneUrl, {
            elementsToWatch: [$repoName],
            getRepoName: $repoName.val.bind($repoName)
        });
    };
});