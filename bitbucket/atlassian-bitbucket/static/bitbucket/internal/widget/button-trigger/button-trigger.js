'use strict';

define('bitbucket/internal/widget/button-trigger', ['jquery', 'lodash'], function ($, _) {

    'use strict';

    var defaults = {
        triggerEvent: 'click',
        stopEvent: true,
        triggerHandler: function triggerHandler(value, event) {
            throw new Error("triggerHandler must be implemented");
        }
    };

    function ButtonTrigger(selectorTrigger, opts) {
        this._opts = $.extend({}, defaults, opts);

        var self = this;

        this._$trigger = $(selectorTrigger).on(this._opts.triggerEvent, _.bind(this.triggerClicked, self));
    }

    ButtonTrigger.prototype.setTriggerDisabled = function (toggle) {
        toggle = toggle === undefined ? true : !!toggle;
        this._$trigger.prop('disabled', toggle).attr('aria-disabled', toggle);
    };

    ButtonTrigger.prototype.isTriggerDisabled = function () {
        return this._$trigger.attr('aria-disabled') === 'true';
    };

    ButtonTrigger.prototype.setTriggerActive = function (toggle) {
        this._$trigger.attr('aria-pressed', toggle === undefined ? true : !!toggle);
    };

    ButtonTrigger.prototype.isTriggerActive = function () {
        return this._$trigger.attr('aria-pressed') === 'true';
    };

    ButtonTrigger.prototype.triggerClicked = function (event) {

        var isOn = this.isTriggerActive();

        if (this.isTriggerDisabled()) {
            if (this._opts.stopEvent) {
                event && event.stopPropagation && event.stopPropagation();
                return false;
            }
            return;
        }

        this._opts.triggerHandler.apply(this, [!isOn].concat(_.toArray(arguments)));

        if (this._opts.stopEvent) {
            event && event.stopPropagation && event.stopPropagation();
            return false;
        }
    };

    return ButtonTrigger;
});