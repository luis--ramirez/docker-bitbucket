'use strict';

define('bitbucket/internal/model/path', ['backbone', 'backbone-brace'], function (Backbone, Brace) {

    'use strict';

    function getName(components) {
        return components.length ? components[components.length - 1] : null;
    }

    function getExtension(name) {
        name = name || '';
        var i = name.lastIndexOf('.');
        return i > 0 ? name.substring(i + 1) : '';
    }

    var Path = Brace.Model.extend({
        _separator: '/',
        namedAttributes: {
            components: ['string'],
            extension: 'string',
            name: 'string'
        },
        constructor: function constructor(stringOrArray) {
            var components = [];
            if (stringOrArray instanceof Array) {
                components = stringOrArray.slice(0);
            } else if (stringOrArray) {
                if (stringOrArray.split) {
                    components = stringOrArray.length ? stringOrArray.split(this._separator) : [];

                    if (components.length) {
                        //normalize - remove leading and trailing slashes.
                        if (!components[components.length - 1]) {
                            components.pop();
                        }
                        if (!components[0]) {
                            components.shift();
                        }
                    }
                } else if (stringOrArray.components) {
                    components = stringOrArray.components.slice(0);
                } else if (stringOrArray.getComponents) {
                    components = stringOrArray.getComponents().slice(0);
                }
            }

            var name = getName(components);
            var extension = getExtension(name);

            Backbone.Model.call(this, {});

            this.setComponents(components);
            this.setName(name);
            this.setExtension(extension);
        },
        getParent: function getParent() {
            return this.getComponents().length ? new Path(this.getComponents().slice(0, this.getComponents().length - 1)) : null;
        },
        isSameDirectory: function isSameDirectory(otherPath) {

            if (this.getComponents().length !== otherPath.getComponents().length) {
                return false;
            }

            var i = this.getComponents().length - 2;
            while (i >= 0 && this.getComponents()[i] === otherPath.getComponents()[i]) {
                i--;
            }

            return i < 0;
        },
        toString: function toString() {
            return this.getComponents().join(this._separator);
        }
    }, {
        fromParentAndName: function fromParentAndName(parentPath, name) {
            return new Path(parentPath.getComponents().concat(name));
        }
    });

    return Path;
});