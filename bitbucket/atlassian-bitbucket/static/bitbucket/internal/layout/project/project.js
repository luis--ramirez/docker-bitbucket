'use strict';

define('bitbucket/internal/layout/project', ['jquery', 'bitbucket/internal/model/page-state', 'bitbucket/internal/model/project', 'bitbucket/internal/widget/sidebar'], function ($, pageState, Project, sidebar) {
    return {
        onReady: function onReady(projectJSON) {
            $(document).ready(sidebar.onReady);
            pageState.setProject(new Project(projectJSON));
        }
    };
});