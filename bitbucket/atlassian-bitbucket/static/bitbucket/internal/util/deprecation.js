'use strict';

define('bitbucket/internal/util/deprecation', ['lodash', 'bitbucket/internal/util/events', 'bitbucket/internal/util/text'], function (_, events, textUtil) {

    'use strict';

    var has = Object.prototype.hasOwnProperty;
    var toString = Object.prototype.toString;

    /**
     * Return a function that logs a deprecation warning to the console the first time it is called.
     *
     * @param {string|Function} displayNameOrShowMessageFn the name of the thing being deprecated. Alternatively, a function to be returned
     * @param {string?} alternativeName the name of the alternative thing to use
     * @param {string?} sinceVersion the version this has been deprecated since
     * @param {string?} removeInVersion the version this will be removed in
     * @return {Function} that logs the warning
     */
    function getShowDeprecationMessage(displayNameOrShowMessageFn, alternativeName, sinceVersion, removeInVersion) {
        if (typeof displayNameOrShowMessageFn === 'function') {
            return displayNameOrShowMessageFn;
        }
        var called = false;
        return function deprecated() {
            if (!called) {
                called = true;
                var message = textUtil.toSentenceCase(displayNameOrShowMessageFn) + " has been deprecated" + (sinceVersion ? " since " + sinceVersion : '') + " and will be removed in " + (removeInVersion || "a future release") + ".";
                if (alternativeName) {
                    message += " Use " + alternativeName + " instead.";
                }

                var err = new Error();
                var stack = err.stack || err.stacktrace;
                var stackMessage = stack && stack.replace(/^Error\n/, "") || 'No stack trace of the deprecated usage is available in your current browser.';
                console.warn(message + "\n" + stackMessage);
            }
        };
    }

    /**
     * Returns a wrapped version of the function that logs a deprecation warning when the function is used.
     * @param {Function} fn the fn to wrap
     * @param {string|Function} displayNameOrShowMessageFn the name of the fn to be displayed in the message. Alternatively, a function to log deprecation warnings
     * @param {string} alternativeName the name of an alternative function to use
     * @param {string} sinceVersion the version this has been deprecated since
     * @param {string} removeInVersion the version this will be removed in
     * @return {Function} wrapping the original function
     */
    function deprecateFunctionExpression(fn, displayNameOrShowMessageFn, alternativeName, sinceVersion, removeInVersion) {
        if (fn.__deprecated) {
            return fn; // don't double deprecate
        }

        var showDeprecationMessage = getShowDeprecationMessage(displayNameOrShowMessageFn || fn.name || 'this function', alternativeName, sinceVersion, removeInVersion);
        var deprecatedFn = function deprecated() {
            showDeprecationMessage();
            return fn.apply(this, arguments);
        };

        Object.defineProperty(deprecatedFn, '__deprecated', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: true
        });

        return deprecatedFn;
    }

    /**
     * Returns a wrapped version of the constructor that logs a deprecation warning when the constructor is instantiated.
     * @param {Function} constructorFn the constructor function to wrap
     * @param {string|Function} displayNameOrShowMessageFn the name of the fn to be displayed in the message. Alternatively, a function to log deprecation warnings
     * @param {string} alternativeName the name of an alternative function to use
     * @param {string} sinceVersion the version this has been deprecated since
     * @param {string} removeInVersion the version this will be removed in
     * @return {Function} wrapping the original function
     */
    function deprecateConstructor(constructorFn, displayNameOrShowMessageFn, alternativeName, sinceVersion, removeInVersion) {
        if (constructorFn.__deprecated) {
            // don't double deprecate
            return constructorFn;
        }
        var deprecatedConstructor = deprecateFunctionExpression(constructorFn, displayNameOrShowMessageFn, alternativeName, sinceVersion, removeInVersion);
        deprecatedConstructor.prototype = constructorFn.prototype;
        _.extend(deprecatedConstructor, constructorFn); //copy static methods across;

        return deprecatedConstructor;
    }

    /**
     * Wraps a "value" object property in a deprecation warning in browsers supporting Object.defineProperty
     * @param {Object} obj the object containing the property
     * @param {string} prop the name of the property to deprecate
     * @param {string|Function} displayNameOrShowMessageFn the display name of the property to deprecate (optional, will fall back to the property name). Alternatively, a function to log deprecation warnings
     * @param {string} alternativeName the name of an alternative to use
     * @param {string} sinceVersion the version this has been deprecated since
     * @param {string} removeInVersion the version this will be removed in
     */
    function deprecateValueProperty(obj, prop, displayNameOrShowMessageFn, alternativeName, sinceVersion, removeInVersion) {
        var oldVal = obj[prop];
        var showDeprecationMessage = getShowDeprecationMessage(displayNameOrShowMessageFn || prop, alternativeName, sinceVersion, removeInVersion);
        Object.defineProperty(obj, prop, {
            get: function get() {
                showDeprecationMessage();
                return oldVal;
            },
            set: function set(val) {
                oldVal = val;
                showDeprecationMessage();
                return val;
            }
        });
    }

    /**
     * Wraps an object property in a deprecation warning, if possible. functions will always log warnings, but other
     * types of properties will only log in browsers supporting Object.defineProperty
     * @param {Object} obj the object containing the property
     * @param {string} prop the name of the property to deprecate
     * @param {string|Function} displayNameOrShowMessageFn the display name of the property to deprecate (optional, will fall back to the property name). Alternatively, a function to log deprecation warnings
     * @param {string} alternativeName the name of an alternative to use
     * @param {string} sinceVersion the version this has been deprecated since
     * @param {string} removeInVersion the version this will be removed in
     */
    function deprecateObjectProperty(obj, prop, displayNameOrShowMessageFn, alternativeName, sinceVersion, removeInVersion) {
        if (typeof obj[prop] === 'function') {
            // assume all functions are constructors.
            obj[prop] = deprecateConstructor(obj[prop], displayNameOrShowMessageFn || prop, alternativeName, sinceVersion, removeInVersion);
        } else {
            deprecateValueProperty(obj, prop, displayNameOrShowMessageFn, alternativeName, sinceVersion, removeInVersion);
        }
    }

    function deprecateAllProperties(obj, objDisplayPrefix, alternativeNamePrefix, sinceVersion, removeInVersion) {
        for (var attr in obj) {
            if (has.call(obj, attr)) {
                deprecateObjectProperty(obj, attr, objDisplayPrefix + attr, alternativeNamePrefix && alternativeNamePrefix + attr, sinceVersion, removeInVersion);
            }
        }
    }

    // These properties will not be touched since Backbone uses them on the model itself.
    // But the deprecation should "just work" because they are synonymous with the attributes.
    var whitelistedProperty = "id";
    // These properties cannot be deprecated well since Backbone uses them on the model itself.
    // We throw early when they are deprecated.
    var blacklistedProperties = /^(attributes|url|isNew|hasChanged|changed(Attributes)|previous(Attributes)|clone)$/;

    /**
     * This function will deprecate a json property on an object that has been converted to a Brace.Model
     * @param {Brace.Model} BraceModel the Brace.Model class that contains the attribute.
     * @param {string} className the name of the Brace.Model class
     * @param {string} attr the name of the attribute to deprecate
     * @param {string} sinceVersion the version this has been deprecated since
     * @param {string} removeInVersion the version this will be removed in
     */
    function deprecateJsonModelProp(BraceModel, className, attr, sinceVersion, removeInVersion) {
        if (whitelistedProperty === attr) {
            return;
        }
        if (blacklistedProperties.test(attr)) {
            throw new Error("The property " + attr + " cannot be deprecated when converting to a Brace model.");
        }
        var showDeprecationMessage = getShowDeprecationMessage(className + '::' + attr, className + "::get|set('" + attr + "')", sinceVersion, removeInVersion);

        Object.defineProperty(BraceModel.prototype, attr, {
            get: function get() {
                showDeprecationMessage();
                return this.get(attr);
            },
            set: function set(val) {
                showDeprecationMessage();
                this.set(attr, val);
            }
        });
    }

    /**
     * This function will deprecate a JSON model in favor of a Brace.Model
     * @param {Brace.Model} BraceModel the Brace.Model class that has replaced a JSON model
     * @param {string} className the name of the Brace.Model class
     * @param {string} sinceVersion the version in which the JSON became a Brace model
     * @param {string} removeInVersion the version in which the JSON attributes will be removed.
     */
    function deprecateJsonModel(BraceModel, className, sinceVersion, removeInVersion) {
        var namedAttrs = BraceModel.prototype.namedAttributes;
        var attr;
        if (toString.call(namedAttrs) === '[object Array]') {
            var i = namedAttrs.length;
            while (i--) {
                deprecateJsonModelProp(BraceModel, className, namedAttrs[i], sinceVersion, removeInVersion);
            }
        } else {
            for (attr in namedAttrs) {
                if (has.call(namedAttrs, attr)) {
                    deprecateJsonModelProp(BraceModel, className, attr, sinceVersion, removeInVersion);
                }
            }
        }
    }

    /**
     * Deprecate an attribute of a brace model by deprecating the getFoo and setFoo convenience methods.
     * @param {function} BraceModel the Brace.Model with the attribute to deprecate
     * @param {string} attributeName the name of the attribute to deprecate
     * @param {string} alternativeName the name or instructions for the alternative
     * @param {string} sinceVersion the version that the attribute was deprecated
     * @param {string} removeInVersion the version that the attribute will be removed
     */
    function deprecateBraceAttribute(BraceModel, attributeName, alternativeName, sinceVersion, removeInVersion) {
        if (has.call(BraceModel.prototype.namedAttributes, attributeName)) {
            var SentenceCaseAttribute = textUtil.toSentenceCase(attributeName);

            BraceModel.prototype['get' + SentenceCaseAttribute] = deprecateFunctionExpression(BraceModel.prototype['get' + SentenceCaseAttribute], attributeName, alternativeName, sinceVersion, removeInVersion);

            BraceModel.prototype['set' + SentenceCaseAttribute] = deprecateFunctionExpression(BraceModel.prototype['set' + SentenceCaseAttribute], attributeName, alternativeName, sinceVersion, removeInVersion);
        }
    }

    /**
     * Deprecates the Brace methods on a model that should now be referenced as read-only JSON.
     *
     * NOTE: This should rarely be used. It is currently used for a bug that leaked into our API.
     *
     * @param {Brace.Model} braceModel the model to deprecate and replace with raw JSON
     * @param {string} sinceVersion the version that the model was deprecated
     * @param {string} removeInVersion the version that the model will be removed
     */
    function deprecateJsonAsBraceModel(braceModel, sinceVersion, removeInVersion) {
        var proto = braceModel.constructor.prototype;
        braceModel = braceModel.clone();
        var json = braceModel.toJSON();
        var attr;

        // a backdoor reference we can use without triggering any deprecation warnings.
        Object.defineProperty(braceModel, '__json', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: json
        });

        // Use a single deprecation message for all properties
        // This avoids calls that cause 4-6 warnings to pop up at once E.g.,
        //      if you call .getMyProp(), which internally calls .get('myProp'), which accesses .attributes, etc...
        var deprecationMessageFn = getShowDeprecationMessage("use of this object's Backbone properties", "raw JSON properties on this object", sinceVersion, removeInVersion);

        for (attr in braceModel) {
            // jshint forin:false
            // No hasOwnProperty check - we want to handle everything accessible from this model
            // that won't already be handled as raw json later
            if (!has.call(json, attr)) {
                deprecateObjectProperty(braceModel, attr, deprecationMessageFn);
            }
        }

        // add the raw json properties onto the object
        for (attr in json) {
            if (has.call(json, attr) && !has.call(braceModel, attr) && !has.call(proto, attr)) {
                braceModel[attr] = json[attr];
            }
        }

        return braceModel;
    }

    var eventDeprecations = {};

    /**
     * @param {string} eventName
     * @param {*} context
     * @param {*} args - excess arguments are passed to the handlers as
     * @param {?string?} alternativeName - the name of the alternative thing to use
     * @param {string?} sinceVersion - the version this has been deprecated since
     * @param {string?} removeInVersion - the version this will be removed in
     */
    function triggerDeprecated(eventName, context /*, ...args, alternativeName, sinceVersion, removeInVersion*/) {
        if (events.listeners(eventName).length) {
            if (arguments.length < 5) {
                throw new Error("eventName, context, alternativeName, sinceVersion, and removeInVersion must all be provided (but can be null).");
            }
            var triggerArgs = Array.prototype.slice.call(arguments, 0, arguments.length - 3);
            var alternativeName = arguments[arguments.length - 3];
            // alternative name should be nullable to mark complete removal of an event.
            alternativeName = alternativeName ? "'" + alternativeName + "'" : null;
            var sinceVersion = arguments[arguments.length - 2];
            var removeInVersion = arguments[arguments.length - 1];
            var showMessage = eventDeprecations[eventName] || (eventDeprecations[eventName] = getShowDeprecationMessage("Event '" + eventName + "'", alternativeName, sinceVersion, removeInVersion));
            showMessage();
            events.trigger.apply(events, triggerArgs);
        }
    }

    return {
        fn: deprecateFunctionExpression,
        construct: deprecateConstructor,
        prop: deprecateObjectProperty,
        obj: deprecateAllProperties,
        braceAsJson: deprecateJsonModel,
        braceAttribute: deprecateBraceAttribute,
        jsonAsBrace: deprecateJsonAsBraceModel,
        triggerDeprecated: triggerDeprecated,
        getMessageLogger: getShowDeprecationMessage
    };
});