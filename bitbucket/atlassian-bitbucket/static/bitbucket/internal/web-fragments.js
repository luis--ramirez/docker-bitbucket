'use strict';

define('bitbucket/internal/impl/web-fragments', ['lodash', 'bitbucket/internal/bbui/web-fragments/web-fragments', 'bitbucket/internal/util/object'], function (_, WebFragmentsSPI, obj) {
    'use strict';

    function stashify(context) {
        return _.transform(context, function (stashContext, value, key) {
            stashContext[key] = value && value._stash ? value._stash : value;
        }, {});
    }

    function WebFragments() {
        WebFragmentsSPI.default.apply(this, arguments);
        this._handlers = {};
    }
    obj.inherits(WebFragments, WebFragmentsSPI.default);

    function _fragmentGetter(type, method, converter) {
        return function (location, context) {
            if (this._handlers[location]) {
                return this._handlers[location](location, [type], stashify(context), context);
            }
            return window.WebFragments[method](location, stashify(context)).map(converter.bind(null, location));
        };
    }

    WebFragments.prototype.getWebItems = _fragmentGetter('ITEM', 'getWebItems', function (location, stash) {
        return {
            type: 'ITEM',
            weight: stash.weight,
            location: location,
            url: stash.url,
            key: stash.moduleKey,
            text: stash.linkText,
            params: stash.params,
            id: stash.linkId,
            cssClass: stash.styleClass,
            tooltip: stash.tooltip,
            iconUrl: stash.iconUrl || null,
            iconWidth: stash.iconWidth || 0,
            iconHeight: stash.iconHeight || 0,
            description: stash.description
        };
    });

    WebFragments.prototype.getWebSections = _fragmentGetter('SECTION', 'getWebSections', function (location, stash) {
        return {
            type: 'SECTION',
            weight: stash.weight,
            location: location,
            key: stash.key,
            text: stash.labelText,
            params: stash.params,
            description: stash.description
        };
    });

    WebFragments.prototype.getWebPanels = _fragmentGetter('PANEL', '_getWebPanels', function (location, stash) {
        return {
            type: 'PANEL',
            weight: stash.weight,
            location: location,
            key: stash.key,
            html: stash.view,
            params: stash.params,
            description: stash.description
        };
    });

    WebFragments.prototype.getWebFragments = function (location, types, context) {
        var self = this;
        return _(types).map(function (type) {
            switch (type) {
                case 'ITEM':
                    return self.getWebItems(location, context);
                case 'SECTION':
                    return self.getWebSections(location, context);
                case 'PANEL':
                    return self.getWebPanels(location, context);
            }
        }).flatten().sortBy('weight').value();
    };

    /**
     * Register a custom handler for web fragments at a certain location
     * Most useful for handling backwards compatibility oddities
     *
     * @param {string} location
     * @param {function(string, Array<string>, Object, Object)} fn - a function to return
     * web fragments. This function will be provided with (location,
     * [fragment types needed], stashified context, original context)
     */
    WebFragments.prototype.registerHandler = function (location, fn) {
        if (this._handlers[location]) {
            throw new Error('Location ' + location + ' is being double handled.');
        }
        this._handlers[location] = fn;
    };

    return new WebFragments();
});