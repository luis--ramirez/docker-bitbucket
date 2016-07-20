'use strict';

define('bitbucket/internal/page/compare', ['jquery', 'bitbucket/internal/feature/compare', 'exports'], function ($, Compare, exports) {

    'use strict';

    /**
     * Init the compare view
     *
     * @param {Object} targetRepository                 - The initial state for the target selector
     * @param {Object} sourceRepository                 - The initial state for the source selector
     * @param {Object} tabs                             - Functions to init a tab when it is selected
     * @returns {*}
     */

    exports.onReady = function (targetRepository, sourceRepository, tabs) {
        var opts = {
            targetRepositoryJson: targetRepository,
            sourceRepositoryJson: sourceRepository,
            tabs: tabs
        };
        return Compare.onReady($('#branch-compare'), opts);
    };
});