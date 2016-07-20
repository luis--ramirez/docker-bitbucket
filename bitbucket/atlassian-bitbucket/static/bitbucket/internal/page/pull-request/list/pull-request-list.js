'use strict';

define('bitbucket/internal/page/pull-requests-list', ['lodash', 'react', 'react-dom', 'bitbucket/util/events', 'bitbucket/util/navbuilder', 'bitbucket/util/state', 'bitbucket/internal/feature/pull-request/list/analytics', 'bitbucket/internal/model-transformer', 'bitbucket/internal/page/pull-request-list/view', 'bitbucket/internal/util/history', 'exports'], function (_, React, ReactDOM, events, nav, state, listAnalytics, transformer, PullRequestListView, history, exports) {
    'use strict';

    // The filter url map is used to convert filter params to url params
    // and vice versa (maps url params back to filter params)

    var queryParamByFilterKey = {
        author_id: 'author',
        reviewer_self: 'reviewing',
        state: 'state',
        target_ref_id: 'at'
    };
    var filterKeyByQueryParam = _.invert(queryParamByFilterKey);

    /**
     * Add a set of params to a given URL
     * @param {string} url
     * @param {Object<string, string>} params
     * @returns {string}
     */
    function urlWithParams(url, params) {
        var uri = nav.parse(url);
        Object.keys(params).forEach(function (k) {
            if (params[k] != null && params[k] !== false) {
                uri.replaceQueryParam(k, params[k]);
            } else {
                // delete params that are empty
                uri.deleteQueryParam(k);
            }
        });
        return uri.toString();
    }

    /**
     * Get a filter object from the URL params
     *
     * @returns {Object<string, string>}
     */
    function filterFromUrlParams() {
        var params = {};
        var uri = nav.parse(window.location);

        // get the query params for each of the items in the filter map
        _.values(queryParamByFilterKey).forEach(function (key) {
            var val = uri.getQueryParamValue(key);
            if (val) {
                if (key === 'reviewing') {
                    params[key] = val !== 'false';
                    return;
                }
                params[key] = val;
            }
        });

        return _.mapKeys(params, function (v, k) {
            return filterKeyByQueryParam[k] || k;
        });
    }

    /**
     * Update the URL with the appropriate params based on given filter
     *
     * @param {Object} filter
     */
    function updateUrlWithFilterParams(filter) {
        var mappedFilterParams = _.mapKeys(filter, function (v, k) {
            return queryParamByFilterKey[k] || k;
        });
        history.replaceState(mappedFilterParams, null, urlWithParams(window.location, mappedFilterParams));
    }

    /**
     *
     * @param {Object} opts
     * @param {Page<PullRequestJSON>} initialData - a page of PRs
     * @param {StashUserJSON} selectedAuthor - author who is selected in the filter
     * @param {RefJSON?} selectedTargetBranch - target branch which is selected in the filter
     */
    exports.onReady = function (opts) {
        events.on('bitbucket.internal.widget.keyboard-shortcuts.register-contexts', function (keyboardShortcuts) {
            keyboardShortcuts.enableContext('pull-request-list');
        });
        var filterParams = filterFromUrlParams();
        var repo = transformer.repository(state.getRepository());
        ReactDOM.render(React.createElement(PullRequestListView, {
            initialData: opts.initialData,
            repository: repo,
            currentUser: transformer.user(state.getCurrentUser()),
            selectedAuthor: transformer.user(opts.selectedAuthor),
            selectedTargetBranch: transformer.ref(opts.selectedTargetBranch, 'branch', repo),
            initialFilter: filterParams, // use the inverse of the filterMap
            gettingStarted: opts.gettingStarted,
            onFilterChange: function onFilterChange(state) {
                updateUrlWithFilterParams(state);
                listAnalytics.onFilterChanged(state);
            }
        }), document.getElementById('pull-requests-content'));

        listAnalytics.init({
            filterParams: filterParams
        });
    };
});