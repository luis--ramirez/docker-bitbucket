'use strict';

define('bitbucket/internal/page/repository-fork', ['jquery', 'bitbucket/internal/feature/project/project-selector', 'bitbucket/internal/feature/repository/cloneUrlGen', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/repository', 'exports'], function ($, ProjectSelector, cloneUrlGen, pageState, Repository, exports) {
    'use strict';

    function initRepositoryPageState(repositoryJson) {
        var repo = new Repository(repositoryJson);
        pageState.setRepository(repo);
        pageState.setProject(repo.getProject());
    }

    function initProjectSelector(projectSelectorSelector, personalProjectJson) {
        var $projectTrigger = $(projectSelectorSelector);
        var $projectInput = $projectTrigger.next('input');
        var $preloadData = personalProjectJson ? [personalProjectJson] : null;
        return new ProjectSelector($projectTrigger, {
            field: $projectInput,
            preloadData: ProjectSelector.constructDataPageFromPreloadArray($preloadData)
        });
    }

    exports.onReady = function (repositoryJson, projectSelectorSelector, personalProjectJson) {
        initRepositoryPageState(repositoryJson);
        var projectSelector = initProjectSelector(projectSelectorSelector, personalProjectJson);

        var $repoName = $("#name");
        var $cloneUrl = $(".clone-url-generated span");

        cloneUrlGen.bindUrlGeneration($cloneUrl, {
            elementsToWatch: [$repoName, projectSelectorSelector],
            getProject: projectSelector.getSelectedItem.bind(projectSelector),
            getRepoName: $repoName.val.bind($repoName)
        });
    };
});