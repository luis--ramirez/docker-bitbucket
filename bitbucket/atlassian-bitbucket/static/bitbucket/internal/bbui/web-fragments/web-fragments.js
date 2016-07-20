define('bitbucket/internal/bbui/web-fragments/web-fragments', ['exports', '../javascript-errors/javascript-errors'], function (exports, _javascriptErrors) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.FragmentType = undefined;


    /**
     * @enum WebFragmentType
     */
    var FragmentType = exports.FragmentType = {
        ITEM: 'ITEM',
        SECTION: 'SECTION',
        PANEL: 'PANEL'
    };

    /**
     * @class WebItem
     * @description Generally for displaying a link, but useful for any case where the plugin should not be allowed to determine the generated
     *     markup. E.g. a toolbar button or menu item, etc.
     * @property {string} type - must be ITEM
     * @property {number} [weight=1000] - a number used to order the item. Lower weights appear earlier or more prominently in the UI than higher ones.
     * @property {string} location - the location this item is being injected
     * @property {string} url - a URL to link to
     * @property {string} key - a unique identifier for the item (in Bitbucket Server this is based on completeModuleKey)
     * @property {string} text - text for the item
     * @property {Map<string,string>} params - a map of parameter name to value. Useful for any custom configuration required for items in a particular location.
     * @property {string?} id - an ID to be applied to the item. Useful for JS-triggered items in Bitbucket Server.
     * @property {string?} cssClass - a CSS class to be applied to the item. Useful for JS-triggered items in Bitbucket Server.
     * @property {string?} tooltip - a tooltip to display on the item
     * @property {string?} iconUrl - a URL for an icon to display with the item
     * @property {number?} iconWidth - a px value for the width at which to display the icon
     * @property {number?} iconHeight - a px value for the height at which to display the icon
     */

    /**
     * @class WebSection
     * @description A grouping of other web fragments. The convention for usage of a Web Section is that its key is used as the location
     *     for another fragment request.
     * @property {string} type - must be SECTION
     * @property {number} [weight=1000] - a number used to order the section. Lower weights appear earlier or more prominently in the UI than higher ones.
     * @property {string} location - the location this section is being injected
     * @property {string} key - a unique identifier for the section (in Bitbucket Server this is based on completeModuleKey)
     * @property {string?} text - text for the section
     * @property {Map<string,string>} params - a map of parameter name to value. Useful for any custom configuration required for sections in a particular location.
     */

    /**
     * @class WebPanel
     * @description Arbitrary markup. Via Connect, this will general be an iframe containing plugin content.
     * @property {string} type - must be PANEL
     * @property {number} [weight=1000] - a number used to order the panel. Lower weights appear earlier or more prominently in the UI than higher ones.
     * @property {string} location - the location this panel is being injected
     * @property {string} key - a unique identifier for the panel (in Bitbucket Server this is based on completeModuleKey)
     * @property {string} html - the html to be injected
     * @property {Map<string,string> params - a map of parameter name to value. Useful for any custom configuration required for panels in a particular location.
     */

    /**
     * An SPI that provides web fragments
     */
    // This is an "interface", unused vars are useful for indicating API, JSDoc for return type is handy even though we throw
    /*eslint no-unused-vars:0, valid-jsdoc:0 */

    var WebFragments = function () {
        function WebFragments() {
            babelHelpers.classCallCheck(this, WebFragments);
        }

        babelHelpers.createClass(WebFragments, [{
            key: 'getWebItems',
            value: function getWebItems(location, context) {
                throw new _javascriptErrors.NotImplementedError();
            }
        }, {
            key: 'getWebSections',
            value: function getWebSections(location, context) {
                throw new _javascriptErrors.NotImplementedError();
            }
        }, {
            key: 'getWebPanels',
            value: function getWebPanels(location, context) {
                throw new _javascriptErrors.NotImplementedError();
            }
        }, {
            key: 'getWebFragments',
            value: function getWebFragments(location, types, context) {
                throw new _javascriptErrors.NotImplementedError();
            }
        }], [{
            key: 'getExampleItem',
            value: function getExampleItem(location, context) {
                var contextList = context && Object.keys(context).join(", ") || '(none)';
                var key = "example-web-item";
                return {
                    type: 'ITEM',
                    completeModuleKey: location + ':' + key,
                    weight: 1000,
                    location: location,
                    url: "#example-web-item-url",
                    key: key,
                    text: "Client Web Item: " + location,
                    params: {},
                    id: null,
                    cssClass: "plugin-point",
                    tooltip: "Client Context Items: " + contextList,
                    iconUrl: null,
                    iconWidth: 0,
                    iconHeight: 0
                };
            }
        }, {
            key: 'getExampleSection',
            value: function getExampleSection(location, context) {
                var key = "example-web-section";
                return {
                    type: 'SECTION',
                    completeModuleKey: location + ':' + key,
                    weight: 1000,
                    location: location,
                    key: key,
                    text: "Client Web Section: " + location,
                    params: {}
                };
            }
        }, {
            key: 'getExamplePanel',
            value: function getExamplePanel(location, context) {
                var contextList = context && Object.keys(context).join(", ") || '(none)';
                var key = "example-web-panel";
                return {
                    type: 'PANEL',
                    completeModuleKey: location + ':' + key,
                    weight: 1000,
                    location: location,
                    key: key,
                    html: '<div class="plugin-point web-panel">' + "<strong>Client Web Panel</strong>: " + location + "<br />" + "<strong>Client Context Items</strong>: " + contextList + '</div>',
                    params: {}
                };
            }
        }]);
        return WebFragments;
    }();

    exports.default = WebFragments;
});