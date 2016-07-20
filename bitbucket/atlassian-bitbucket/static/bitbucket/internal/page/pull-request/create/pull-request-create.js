'use strict';

define('bitbucket/internal/page/pull-request-create', ['jquery', 'bitbucket/internal/feature/compare', 'exports'], function ($, Compare, exports) {

    'use strict';

    /**
     * Init the compare view
     *
     * @param {Object} targetRepository                 - The initial state for the target selector
     * @param {Object} sourceRepository                 - The initial state for the source selector
     * @param {Object} tabs                             - Functions to init a tab when it is selected
     * @param {List} [submittedReviewers=[]]            - Reviewers to pre-populate the reviewers field with.
     * @param {List} [additionalPreloadRepositories=[]] - Repositories to preload to speed up the selectors.
     * @returns {*}
     */

    exports.onReady = function (targetRepository, sourceRepository, tabs, submittedReviewers, additionalPreloadRepositories) {
        var opts = {
            targetRepositoryJson: targetRepository,
            sourceRepositoryJson: sourceRepository,
            tabs: tabs,
            prCreateMode: true
        };
        if (submittedReviewers) {
            opts.submittedReviewers = submittedReviewers;
        }
        if (additionalPreloadRepositories) {
            opts.additionalPreloadRepositories = additionalPreloadRepositories;
        }
        return Compare.onReady($('#branch-compare'), opts);
    };
});