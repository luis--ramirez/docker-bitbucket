'use strict';

define('bitbucket/internal/page/users/profile', ['jquery', 'bitbucket/internal/feature/repository/repository-table', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/project', 'bitbucket/internal/util/notifications', 'exports'], function ($, RepositoryTable, pageState, Project, notifications, exports) {
    'use strict';

    exports.onReady = function (repositoryTableSelector, projectJson, isOwnProfile, userDisplayName, isPersonalRepositoryEnabled) {
        // Attach flash notifications. Can be result of deleted repositories
        notifications.showFlashes();
        // Set the project value in the page state if personal repos are enabled
        if (isPersonalRepositoryEnabled) {
            pageState.setProject(new Project(projectJson));
        }

        var repositoryTableParams = {
            projectKey: projectJson.key,
            showPublicStatus: true,
            noneFoundMessageHtml: isOwnProfile ? bitbucket.internal.users.profile.noRepositoriesSelf({ projectKey: projectJson.key }) : bitbucket.internal.users.profile.noRepositories({ userDisplayName: userDisplayName }),
            bufferPixels: $('#footer').height()
        };

        if (!isPersonalRepositoryEnabled) {
            repositoryTableParams.noneFoundMessageHtml = bitbucket.internal.users.profile.personalRepositoryDisabled();
        }

        new RepositoryTable(repositoryTableSelector, repositoryTableParams).init();
    };
});