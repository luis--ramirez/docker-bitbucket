'use strict';

define('bitbucket/internal/widget/keyboard-shortcuts', ['aui', 'jquery', 'lodash', 'bitbucket/internal/util/events', 'bitbucket/internal/util/navigator', 'exports'], function (AJS, $, _, events, navigatorUtil, exports) {

    'use strict';

    var CTRL = /^[cC]trl$/i;
    var CMD = '⌘'; // Mac `command` key symbol

    var ANALYTICS_EVENT_PREFIX = 'bitbucket.internal.keyboard.shortcuts';
    var enablingContext;

    var _shortcutsByDisplayContext = {};

    function KeyboardShortcuts() {
        if (!(this instanceof KeyboardShortcuts)) {
            return new KeyboardShortcuts();
        }

        this._enabledContexts = [];
    }

    KeyboardShortcuts.prototype._setRegistry = function (registry) {
        this._registry = registry;
    };

    KeyboardShortcuts.prototype._initContent = function () {
        this._dialog = AJS.dialog2(aui.dialog.dialog2({
            titleText: AJS.I18n.getText('bitbucket.web.keyboardshortcut.header'),
            content: bitbucket.internal.widget.keyboardShortcutsContent({
                contextNames: _.keys(_shortcutsByDisplayContext),
                contexts: _.values(_shortcutsByDisplayContext)
            }),
            size: 'large',
            id: 'keyboard-shortcut-dialog'
        }));
    };

    KeyboardShortcuts.prototype._bind = function ($trigger) {
        this._$trigger = $trigger;
        var self = this;
        this._$trigger.on('click', function (e) {
            e.preventDefault();
            self._show();
        });
    };

    KeyboardShortcuts.prototype.enableContext = function (context) {
        if ($.inArray(context, this._enabledContexts) !== -1) {
            return;
        }
        enablingContext = context;
        this._registry.enableContext(context);
        enablingContext = undefined;
        this._enabledContexts.push(context);
    };

    KeyboardShortcuts.prototype.resetContexts = function () {
        AJS.trigger("remove-bindings.keyboardshortcuts");
        this._enabledContexts = [];
        AJS.trigger("add-bindings.keyboardshortcuts");
    };

    KeyboardShortcuts.prototype._show = function () {
        //If this is the first time shown, init the content
        if (!this._hasShown) {
            this._initContent();
            this._hasShown = true;
        }
        this._dialog.show();
    };

    KeyboardShortcuts.prototype.addCustomShortcut = function (context, keys, description, displayContext) {
        var shortcut = internalizeShortcut({
            keys: keys,
            context: context,
            displayContext: displayContext,
            description: description
        }, { convertOSModifier: false });
    };

    KeyboardShortcuts.convertOSModifier = function (key) {
        return navigatorUtil.isMac() ? key.replace(CTRL, CMD) : key;
    };

    function internalizeShortcut(shortcut, options) {
        //need to do a copy to avoid messing up the shortcuts for whenIType
        shortcut = $.extend({}, shortcut);
        shortcut.keys = _.map(shortcut.keys, function (option) {
            return _.map(option, function (keypress) {
                if (_.all(['key', 'modifiers'], _.partial(_.has, keypress))) {
                    return keypress;
                }

                //Don't split on '+' when keypress length is 1, in case keypress is '+' only.
                var presses = keypress.length > 1 ? keypress.split("+") : keypress;
                if (!_.isArray(presses) || presses.length === 1) {
                    return keypress;
                }
                return {
                    'key': presses.pop(),
                    // default is to convert the modifier
                    'modifiers': options && options.convertOSModifier === false ? presses : _.map(presses, KeyboardShortcuts.convertOSModifier)
                };
            });
        });

        if (!shortcut.displayContext) {
            shortcut.displayContext = KeyboardShortcuts._contextDisplayInfo[shortcut.context] ? KeyboardShortcuts._contextDisplayInfo[shortcut.context].displayName : shortcut.context.replace(/\b[a-z]/g, function (str) {
                return str.toUpperCase();
            });
        }

        if (!_shortcutsByDisplayContext[shortcut.displayContext]) {
            _shortcutsByDisplayContext[shortcut.displayContext] = [];
        }
        _shortcutsByDisplayContext[shortcut.displayContext].push(shortcut);
    }

    KeyboardShortcuts.internalizeShortcuts = function (shortcuts) {
        _.each(shortcuts, internalizeShortcut);
    };

    KeyboardShortcuts._contextDisplayInfo = {
        'repository': { displayName: AJS.I18n.getText('bitbucket.web.keyboardshortcut.context.repository') },
        'branch-compare': { displayName: AJS.I18n.getText('bitbucket.web.keyboardshortcut.context.branch-compare') },
        'branch-list': { displayName: AJS.I18n.getText('bitbucket.web.keyboardshortcut.context.branch-list') },
        'commit': { displayName: AJS.I18n.getText('bitbucket.web.keyboardshortcut.context.commit') },
        'commits': { displayName: AJS.I18n.getText('bitbucket.web.keyboardshortcut.context.commits') },
        'diff-tree': { displayName: AJS.I18n.getText('bitbucket.web.keyboardshortcut.context.diff-tree') }, //Map this to commit too
        'diff-view': { displayName: AJS.I18n.getText('bitbucket.web.keyboardshortcut.context.diff-view') },
        'filebrowser': { displayName: AJS.I18n.getText('bitbucket.web.keyboardshortcut.context.filebrowser') },
        'global': { displayName: AJS.I18n.getText('bitbucket.web.keyboardshortcut.context.global') },
        'pull-request': { displayName: AJS.I18n.getText('bitbucket.web.keyboardshortcut.context.pull-request') },
        'pull-request-list': { displayName: AJS.I18n.getText('bitbucket.web.keyboardshortcut.context.pull-request-list') },
        'pull-request-overview': { displayName: AJS.I18n.getText('bitbucket.web.keyboardshortcut.context.pull-request') },
        'sourceview': { displayName: AJS.I18n.getText('bitbucket.web.keyboardshortcut.context.sourceview') }
    };

    function fireKeyboardShocutAnalyticsEvent(context, keyEventName) {
        events.trigger('bitbucket.internal.ui.keyboard.shortcutClicked', null, {
            context: context,
            keyEventName: keyEventName
        });
    }

    var keyboardShortcuts = new KeyboardShortcuts();
    exports.onReady = function () {
        // hardcoded keyboard link selector for now

        keyboardShortcuts._bind($('.keyboard-shortcut-link'));

        var onAfterDocumentReady = $.Deferred();
        $(document).ready(function () {
            // ensure everyone has had a chance to bind listeners before initializing
            setTimeout(function () {
                onAfterDocumentReady.resolve();
            }, 0);
        });

        AJS.bind("register-contexts.keyboardshortcuts", function (e, data) {

            keyboardShortcuts._setRegistry(data.shortcutRegistry);
            keyboardShortcuts.enableContext("global");

            onAfterDocumentReady.done(function () {
                events.trigger('bitbucket.internal.widget.keyboard-shortcuts.register-contexts', keyboardShortcuts, keyboardShortcuts);
            });
        });

        AJS.bind("shortcuts-loaded.keyboardshortcuts", function (e, data) {
            KeyboardShortcuts.internalizeShortcuts(data.shortcuts);
        });

        // TODO: load real keyboard shortcuts version.  Updating keyboard shortcuts will cause caching hell currently.
        AJS.params["keyboardshortcut-hash"] = 'bundled';

        AJS.trigger("initialize.keyboardshortcuts");

        // This is ugly but it avoids an uglier circular dependency that would exist if it was moved upto the list of dependencies.
        require('bitbucket/internal/util/shortcuts').bind('keyboardShortcutsDialog', keyboardShortcuts._show.bind(keyboardShortcuts));
    };

    /**
     * Converts 'ctrl+shift+p' to ' Type (Ctrl + Shift + p)' (or the version for Mac)
     * and appends it to $el's title attribute.
     */
    exports.addTooltip = function ($el, keys) {
        var keysTitle = _(keys.split('+')).chain().map(KeyboardShortcuts.convertOSModifier).map(function (key) {
            if (key === 'shift') {
                return AJS.I18n.getText('bitbucket.web.keyboardshortcut.key.shift');
            } else if (key === 'ctrl') {
                return KeyboardShortcuts.convertOSModifier(AJS.I18n.getText('bitbucket.web.keyboardshortcut.key.ctrl'));
            } else {
                return key;
            }
        }).value().join(' + ');
        var oldTitle = $el.attr('title');
        $el.attr('title', oldTitle + AJS.I18n.getText('bitbucket.web.keyboardshortcut.type', keysTitle));
        return {
            remove: function remove() {
                $el.attr('title', oldTitle);
            }
        };
    };

    /**
     * Sets up key board shortcut analytics
     *
     * @param {string} keyEventName - The name of the event to setup
     * @param {Bacon} baconStream
     */
    exports.bindKeyboardShortcutAnalytics = function (keyEventName, baconStream) {
        baconStream.onValue(fireKeyboardShocutAnalyticsEvent.bind(null, enablingContext, keyEventName));
    };

    exports.fireKeyboardShocutAnalyticsEvent = fireKeyboardShocutAnalyticsEvent;

    /**
     * Gets the context that is currently being enabled.
     *
     * @returns {string} the name of the context being enabled.
     */
    exports.getEnablingContext = function () {
        return enablingContext;
    };

    exports.showDialog = function () {
        if (keyboardShortcuts) {
            keyboardShortcuts._show();
        }
    };

    exports.resetContexts = function () {
        keyboardShortcuts.resetContexts();
    };
});