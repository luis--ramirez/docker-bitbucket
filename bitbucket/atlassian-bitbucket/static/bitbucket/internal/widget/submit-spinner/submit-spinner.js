'use strict';

define('bitbucket/internal/widget/submit-spinner', ['jquery'], function ($) {

    'use strict';

    function SubmitSpinner(buttonElement, position) {
        if (!(this instanceof SubmitSpinner)) {
            return new SubmitSpinner(buttonElement);
        }

        this.$button = $(buttonElement);
        this.$spinner = $('<div class="submit-spinner invisible" />');

        if (position === "before") {
            this.$spinner.insertBefore(this.$button);
        } else {
            this.$spinner.insertAfter(this.$button);
        }
    }

    SubmitSpinner.prototype.show = function () {
        this.$spinner.removeClass('invisible');
        this.$spinner.spin();
        return this;
    };

    SubmitSpinner.prototype.hide = function () {
        this.$spinner.addClass('invisible');
        this.$spinner.spinStop();
        return this;
    };

    SubmitSpinner.prototype.remove = function () {
        this.$spinner.remove();
        return this;
    };

    return SubmitSpinner;
});