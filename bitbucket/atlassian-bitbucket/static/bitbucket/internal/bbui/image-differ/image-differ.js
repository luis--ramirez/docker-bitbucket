define('bitbucket/internal/bbui/image-differ/image-differ', ['exports', 'jquery', './differ', './image-differ-toolbar'], function (exports, _jquery, _differ, _imageDifferToolbar) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.Toolbar = exports.Differ = exports.init = undefined;

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _differ2 = babelHelpers.interopRequireDefault(_differ);

    var _imageDifferToolbar2 = babelHelpers.interopRequireDefault(_imageDifferToolbar);

    /**
     * @param {jQuery|HtmlElement} container - The container to use for this Image Differ
     * @returns {{on: Function, readyPromise: Promise}}
     */
    function init(container) {
        var $container = (0, _jquery2.default)(container);
        var toolbar = new _imageDifferToolbar2.default((0, _jquery2.default)(bitbucket.internal.component.imageDiffer.toolbar.main()).prependTo($container));
        var differ = new _differ2.default($container);

        toolbar.on('modeChanged', function (mode) {
            return differ.setMode(mode.newMode);
        });

        var readyPromise = new _jquery2.default.Deferred();
        differ.init().done(function (enabledModes) {
            if (toolbar) {
                toolbar.init(enabledModes);
            }
            readyPromise.resolve({

                /**
                 * Stop exposing this method when Stash no longer needs to retrigger Image Differ events
                 * @deprecated
                 */
                on: differ.on.bind(differ),
                enabledModes: enabledModes,
                _differ: differ,
                _toolbar: toolbar,
                destroy: function destroy() {
                    differ.destroy();
                    differ = null;
                    toolbar.destroy();
                    toolbar = null;
                }
            });
        });
        return readyPromise;
    }

    exports.init = init;
    exports.Differ = _differ2.default;
    exports.Toolbar = _imageDifferToolbar2.default;
});