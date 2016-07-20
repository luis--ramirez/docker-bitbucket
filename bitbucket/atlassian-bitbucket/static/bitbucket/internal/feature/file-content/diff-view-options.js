'use strict';

define('bitbucket/internal/feature/file-content/diff-view-options', ['jquery', 'lodash', 'bitbucket/internal/util/client-storage', 'bitbucket/internal/util/events'], function ($, _, clientStorage, events) {

    'use strict';

    // Make sure the storageKey only gets initialized when required

    var storageKey = _.once(function () {
        return clientStorage.buildKey(['diff-view', 'options'], 'user');
    });

    function DiffViewOptions() {}

    events.addLocalEventMixin(DiffViewOptions.prototype);

    /**
     * Lazily initialize our options here and cache them for future access.
     *
     * @returns {Object}
     */
    DiffViewOptions.prototype.getOptions = _.memoize(function () {
        return _.extend({}, this.defaults, clientStorage.getItem(storageKey()));
    });

    DiffViewOptions.prototype.defaults = {
        ignoreWhitespace: false,
        hideComments: false,
        hideEdiff: false,
        diffType: 'unified'
    };

    /**
     * Trigger the currently viewed file to update.
     *
     * Usually after an option has been changed.
     *
     * @param {string} key
     * @param {string} value
     */
    DiffViewOptions.prototype.triggerUpdate = function (key, value) {
        var entry = {
            key: key,
            value: value
        };
        this.trigger('change', entry);
        events.trigger('bitbucket.internal.feature.fileContent.optionsChanged', null, entry);
    };

    /**
     * Set a diff option
     *
     * We use a setter so that we can keep an internal reference to the
     * key/value pair while also updating clientStorage
     *
     * @param {string} key
     * @param {*} value
     * @param {boolean} [update] trigger an update event?
     */
    DiffViewOptions.prototype.set = function (key, value, update) {
        this.getOptions()[key] = value;
        //Also update storage
        clientStorage.setItem(storageKey(), this.getOptions());

        if (update !== false) {
            this.triggerUpdate(key, value);
        }
    };

    /**
     * Get a diff option
     *
     * @param {string} key
     * @returns {*}
     */
    DiffViewOptions.prototype.get = function (key) {
        return this.getOptions()[key];
    };

    DiffViewOptions.prototype.proxy = function (overrides) {
        var target = this;
        var proxy = new DiffViewOptions();

        proxy.getOptions = function () {
            return $.extend({}, target.getOptions(), overrides);
        };
        proxy.set = function (key, value, update) {
            if (overrides[key] === undefined) {
                target.set(key, value, update);
            }
        };
        proxy.destroy = events.chainWith(target).on('change', function (entry) {
            if (overrides[entry.key] === undefined) {
                proxy.trigger('change', entry);
            }
        }).destroy;

        return proxy;
    };

    return new DiffViewOptions();
});