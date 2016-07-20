'use strict';

define('bitbucket/internal/layout/base/menu/recent-repos', ['jquery', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/util/ajax', 'bitbucket/internal/util/events', 'bitbucket/internal/util/html', 'bitbucket/internal/util/shortcuts', 'exports'], function ($, _, nav, ajax, events, html, shortcuts, exports) {
    'use strict';

    exports.initMenu = function (menuTriggerId) {

        var $menuTrigger = $('#' + menuTriggerId);
        var $menu = $('#' + html.sanitizeId($menuTrigger.attr('aria-controls'))).addClass('recent-repositories-menu');
        var $repoList = $menu.find('.recent-repositories-section ul');
        var $loading = $(bitbucket.internal.layout.menu.loadingRecentReposMenuItem());

        shortcuts.bind('recentRepositories', _.ary($.fn.click.bind($menuTrigger), 0));

        // Trigger UI events
        $menu.on('aui-dropdown2-show', function () {
            events.trigger('bitbucket.internal.ui.nav.repositories.opened');
        });
        $menu.on('click', 'a', function () {
            var $section = $(this).closest('.aui-dropdown2-section');
            if ($section.is('.recent-repositories-section')) {
                events.trigger('bitbucket.internal.ui.nav.repositories.item.clicked', null, {
                    repositoryId: $(this).attr('data-repo-id')
                });
            }
            if ($section.is('.public-repo-list-link-section')) {
                events.trigger('bitbucket.internal.ui.nav.repositories.public.clicked');
            }
        });

        $repoList.append($loading);

        var fetchRecentRepos = function fetchRecentRepos() {
            ajax.rest({
                url: nav.rest().profile().recent().repos().withParams({
                    avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'xsmall' })
                }).build(),
                statusCode: {
                    '*': function _() {
                        return false; // don't show any error messages
                    }
                }
            }).done(function (data) {
                if (data && data.size) {
                    var sortedValues = data.values;
                    sortedValues.sort(function (repo1, repo2) {
                        return repo1.project.name.localeCompare(repo2.project.name) || repo1.name.localeCompare(repo2.name);
                    });

                    $repoList.append($(bitbucket.internal.feature.repository.menuItems({ repos: sortedValues })));
                } else {
                    $repoList.append($(bitbucket.internal.layout.menu.noRecentReposMenuItem()));
                }
                // Fire an event with the recent repository data so that other parts of Stash have access to it
                events.trigger('bitbucket.internal.feature.repositories.recent.loaded', this, data);
            }).fail(function () {
                $repoList.append($(bitbucket.internal.layout.menu.errorLoadingRecentReposMenuItem()));
            }).always(function () {
                $loading.remove();
            });
        };

        //Load only once all other resources have loaded
        $(window).on('load', fetchRecentRepos);
    };
});