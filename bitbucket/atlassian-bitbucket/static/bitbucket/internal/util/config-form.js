'use strict';

define('bitbucket/internal/util/config-form', ['aui', 'jquery', 'lodash', 'bitbucket/internal/util/ajax'], function (AJS, $, _, ajax) {

    'use strict';

    function getValue(expr, context) {
        return _.isFunction(expr) ? expr(_.extend({}, context)) : expr;
    }

    // TODO remove this cache.
    // this caching is really ugly and to me exposes the bad design the descriptor.
    // We should be able to access the loadTransformer and saveTransformer from
    // the descriptor itself
    var fragmentsByDescriptorKey = {};

    //Construct a fragment out of a descriptor and its config
    function toFragment(descriptor, context) {
        var fragment = {};

        context = _.extend({}, context, descriptor.params);

        if (descriptor['context-provider']) {
            context = getValue(descriptor['context-provider'], context);
        }
        var errorMessage;
        try {
            _.each(descriptor, function (value, key) {
                if (!/params|context-provider|view/.test(key)) {
                    fragment[key] = getValue(descriptor[key], context);
                } else if (key === 'view') {
                    var view = value(context);
                    if (view) {
                        var transformedView = {};
                        if ((typeof view === 'undefined' ? 'undefined' : babelHelpers.typeof(view)) === 'object') {
                            transformedView = _.extend(transformedView, view);
                        }

                        //If there's a transformer for loading config data, apply it now
                        if (view.loadTransformer) {
                            context.config = getValue(view.loadTransformer, context.config);
                        }
                        var formContents = _.isFunction(view.formContents) ? view.formContents : view;
                        transformedView.formContents = getValue(formContents, context);

                        fragment.view = transformedView;
                    }
                }
            });
        } catch (error) {
            errorMessage = error;
        }

        if (!fragment.view) {
            fragment.view = {
                formContents: aui.message.error({ content: AJS.escapeHtml(AJS.I18n.getText('bitbucket.web.config.form.load.error', fragment.pluginKey + ":" + fragment.key, errorMessage ? errorMessage : "Unknown error")) })
            };
        }

        fragment.moduleKey = fragment.key;
        fragment.completeModuleKey = fragment.pluginKey + ":" + fragment.key;

        //cache the generated fragment
        fragmentsByDescriptorKey[fragment.completeModuleKey] = fragment;

        return fragment;
    }

    function getFragment(descriptor) {
        return fragmentsByDescriptorKey[descriptor.pluginKey + ":" + descriptor.key];
    }

    function getFormDescriptor(contextName) {
        /* global WebFragments:false */
        var hookDescriptors = WebFragments.getWebFragmentDescriptors(contextName, 'panel');
        if (hookDescriptors && hookDescriptors.length) {
            return hookDescriptors[0];
        } else {
            return null;
        }
    }

    function ConfigForm(container, configContextName) {
        this.$container = $(container);
        this.configContextName = configContextName;
    }

    ConfigForm.prototype.loadAndRender = function (configLoader) {
        // Fetch the config and the web resources required to load the form.
        // When we have both, we are able to render the form.
        return $.when(configLoader(), this._loadWebResources().fail(_.bind(function (error) {
            // The resource loading has failed - the soy is probably broken
            this.$container.html(aui.message.error({ content: error.message }));
        }, this))).done(_.bind(function (configArgs) {
            this._render(configArgs[0]);
        }, this));
    };

    ConfigForm.prototype._loadWebResources = function () {
        return WRM.require('wrc!' + this.configContextName);
    };

    ConfigForm.prototype._render = function (config, fieldErrors, formErrors) {
        var renderContext = { config: config || {}, errors: fieldErrors };
        var hookDescriptor = getFormDescriptor(this.configContextName);
        var fragment = toFragment(hookDescriptor, renderContext);
        this.$container.empty();

        if (fragment && fragment.view && fragment.view.formContents) {
            this.$container.append(bitbucket.internal.widget.form({ content: fragment.view.formContents, action: '', errors: formErrors }));
            this.$container.find(':input:visible:enabled:first').first().focus();
        }

        if (fragment && fragment.view && fragment.view.initForm) {
            fragment.view.initForm(config);
        }
    };

    ConfigForm.prototype.save = function (configSaver) {
        var config = ajax.formToJSON(this.$container.find('form.aui'));
        var hookDescriptor = getFormDescriptor(this.configContextName);
        var fragment = getFragment(hookDescriptor);
        if (fragment && fragment.view && fragment.view.saveTransformer) {
            config = fragment.view.saveTransformer(config);
        }

        // ensure the result is a promise
        return $.when(configSaver(config)).fail(_.bind(this._validationErrors, this, config));
    };

    ConfigForm.prototype._validationErrors = function (config, xhr, textStatus, errorThrown, result) {
        // Turn [{context: "", message: ""}] into {context: [message]}
        var errors = _.reduce(result.errors, function (memo, item) {
            memo[item.context] = (memo[item.context] || []).concat([item.message]);
            return memo;
        }, {});
        // `errors.null` seems weird, but that's the property that errors with the context "null" from the
        // backend will end up with. Object keys are coerced to strings, so null is actually a string key in this
        // case.
        this._render(config, errors, errors.null);
    };

    return ConfigForm;
});

var ConfigForm = require('bitbucket/internal/util/config-form');