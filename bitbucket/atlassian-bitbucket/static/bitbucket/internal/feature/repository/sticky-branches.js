'use strict';

define('bitbucket/internal/feature/repository/sticky-branches', ['jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/util/browser-location', 'bitbucket/internal/util/client-storage', 'bitbucket/internal/util/events', 'exports'], function ($, _, nav, browserLocation, clientStorage, events, exports) {

    var $fileBrowseLink;
    var $commitsLink;
    var $branchesLink;

    exports.onReady = function () {
        var pageUrl = nav.parse(browserLocation.location.href);
        var browseUrl = nav.currentRepo().browse().build();
        var commitsUrl = nav.currentRepo().commits().build();
        var isBrowsePage = pageUrl.path().indexOf(browseUrl) === 0; //treat all sub-pages (folders and files) like the browse page
        var isCommitsPage = pageUrl.path() === commitsUrl;
        var customRef = isBrowsePage ? pageUrl.getQueryParamValue('at') : isCommitsPage ? pageUrl.getQueryParamValue('until') : undefined;
        var resetIfNoCustomRef = isBrowsePage || isCommitsPage;
        var branchSessionKey = clientStorage.buildKey('current-branch', 'repo');
        var sessionRef = clientStorage.getSessionItem(branchSessionKey);

        $fileBrowseLink = $('#repository-nav-files');
        $commitsLink = $('#repository-nav-commits');
        $branchesLink = $('#repository-nav-branches');

        var isCustomRefCommit;

        // if we have a custom ref and we're on the browse page then we check if this
        // custom ref is a commit id
        if (customRef && isBrowsePage) {
            var revisionRef = $('[data-revision-ref]', '#repository-layout-revision-selector').data('revision-ref');
            // On the "browse" page we consider the customRef a commit id if:
            // - the branch selector is showing the same commit as our customRef
            // - the branch selector is not showing our customRef, it's a branch or tag, but the customRef is still "commit id-ish". This occurs
            //   when there is an existing branch or tag that matches the "at" commit id that clicking on "View Source" has added.
            //   The regex should never match a real branch/tag "at" as that will include "refs/{heads,tags}".
            isCustomRefCommit = revisionRef && (revisionRef.id === customRef && revisionRef.type.id === 'commit' || revisionRef.id !== customRef && (revisionRef.type.id === 'branch' || revisionRef.type.id === 'tag') && /^[0-9a-f]{7,40}$/.test(customRef));
        }

        // we don't want to use the customRef if we're on the browse page and it IS a commit id
        var useCustomRef = !(isBrowsePage && isCustomRefCommit);

        if (customRef && useCustomRef) {
            customRef = decodeURIComponent(customRef);

            if (customRef !== sessionRef) {
                //update the stored ref in the session
                clientStorage.setSessionItem(branchSessionKey, customRef);
            }

            addRefToNavLinks(customRef);
        } else if (resetIfNoCustomRef && useCustomRef) {
            // If we are on the browse or commits page, and the user visits without a ref specified,
            // even if we have a ref in the session storage, reset to the default branch and clear the session storage
            // Prevents inconsistency between nav links and branch selector (branch selector would have default branch,
            // but the nav links would link to the session ref)
            clientStorage.removeSessionItem(branchSessionKey);
        } else if (sessionRef) {
            // If we have a ref stored in the session, use it
            addRefToNavLinks(sessionRef);
        }

        events.on('bitbucket.internal.layout.branch.revisionRefChanged', function (revisionRef) {
            if (revisionRef) {
                if (!revisionRef.getIsDefault()) {
                    var refId = revisionRef.getId();

                    addRefToNavLinks(refId);
                    clientStorage.setSessionItem(branchSessionKey, refId);
                } else {
                    removeRefFromNavLinks();
                    clientStorage.removeSessionItem(branchSessionKey);
                }
            }
        });

        // Eve is not greedy with its wild card matching. We are assuming the first part
        // is page|feature|widget|layout and the second part is the name of the component
        events.on('bitbucket.internal.*.*.revisionRefRemoved', function (ref) {
            // This is definitely _not_ perfect. This can potentially incorrectly
            // match when the suffix. Ideally we would be comparing ids but often
            // branchSessionKey stores a displayId. However .refRemoved is not a
            // common action so it is safer to just clear the history.
            var branch = clientStorage.getSessionItem(branchSessionKey);
            if (branch && _.endsWith(ref.id, branch)) {
                removeRefFromNavLinks();
                clientStorage.removeSessionItem(branchSessionKey);
            }
        });
    };

    function addRefToNavLinks(ref) {
        if (ref) {
            ref = encodeURIComponent(ref);

            $fileBrowseLink.attr('href', nav.parse($fileBrowseLink.attr('href')).replaceQueryParam('at', ref));
            $commitsLink.attr('href', nav.parse($commitsLink.attr('href')).replaceQueryParam('until', ref));
            $branchesLink.attr('href', nav.parse($branchesLink.attr('href')).replaceQueryParam('base', ref));
        } else {
            removeRefFromNavLinks();
        }
    }

    function removeRefFromNavLinks() {
        $fileBrowseLink.attr('href', nav.parse($fileBrowseLink.attr('href')).deleteQueryParam('at'));
        $commitsLink.attr('href', nav.parse($commitsLink.attr('href')).deleteQueryParam('until'));
        $branchesLink.attr('href', nav.parse($branchesLink.attr('href')).deleteQueryParam('base'));
    }
});