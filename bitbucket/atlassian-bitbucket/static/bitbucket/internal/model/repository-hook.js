'use strict';

define('bitbucket/internal/model/repository-hook', ['aui', 'backbone-brace', 'lodash', 'bitbucket/util/navbuilder', 'bitbucket/internal/util/ajax'], function (AJS, Brace, _, nav, ajax) {

    'use strict';

    function showErrorWithReloadButton(xhr, textStatus, errorThrown, errors, dominantError) {
        return _.extend({}, dominantError, {
            fallbackTitle: AJS.I18n.getText('bitbucket.web.repository.settings.hooks.notfound.fallback.title'),
            fallbackUrl: nav.currentRepo().hooks().build(),
            canClose: false,
            shouldReload: false
        });
    }

    var RepositoryHookDetails = Brace.Model.extend({
        idAttribute: 'key',
        namedAttributes: {
            'key': 'string',
            'name': 'string',
            'type': 'string',
            'description': 'string',
            'version': 'string',
            'configFormKey': 'string'
        }
    });

    var RepositoryHook = Brace.Model.extend({
        namedAttributes: {
            'details': RepositoryHookDetails,
            'enabled': 'boolean',
            'configured': 'boolean'
        },
        initialize: function initialize() {
            // Unfortunately there doesn't appear to be a way to use a nested idAttribute
            this.id = this.getDetails().getKey();
        },
        loadSettings: function loadSettings() {
            return ajax.rest({
                url: nav.rest().currentRepo().hook(this).settings().build()
            });
        },
        saveSettings: function saveSettings(config) {
            return ajax.rest({
                url: nav.rest().currentRepo().hook(this).settings().build(),
                type: 'PUT',
                data: config,
                statusCode: {
                    '400': false
                }
            });
        },
        enable: function enable(config) {
            var opts = {
                url: nav.rest().currentRepo().hook(this).enabled().build(),
                type: 'PUT',
                statusCode: {
                    '404': showErrorWithReloadButton,
                    '400': false
                }
            };
            if (config) {
                opts.data = config;
            }
            var restPromise = ajax.rest(opts);
            restPromise.done(_.bind(this.setEnabled, this, true));
            return restPromise;
        },
        disable: function disable() {
            var restPromise = ajax.rest({
                url: nav.rest().currentRepo().hook(this).enabled().build(),
                type: 'DELETE',
                statusCode: {
                    '404': showErrorWithReloadButton
                }
            });
            restPromise.done(_.bind(this.setEnabled, this, false));
            return restPromise;
        }
    });

    RepositoryHook.Collection = Brace.Collection.extend({
        model: RepositoryHook
    });

    return RepositoryHook;
});