'use strict';

define('bitbucket/internal/widget/progress-bar', ['jquery'], function ($) {

    'use strict';

    function ProgressBar(selector) {
        if (!(this instanceof ProgressBar)) {
            return new ProgressBar(selector);
        }
        this._$container = $(selector);
        this._$progress = this._$container.children('.progress-bar');
        this._$bar = this._$progress.children('.bar');
        this._$message = this._$container.children('.progress-message');
        if (this._$message.length === 0) {
            this._$message = undefined;
        }
        return this;
    }

    ProgressBar.prototype.update = function (status) {
        this.percentage(status.percentage);
        this.message(status.message);
        return this;
    };

    ProgressBar.prototype.message = function (newValue) {
        if (newValue !== undefined) {
            if (!this._$message) {
                this._$message = $('<p class="progress-message"></p>');
                this._$container.append(this._$message);
            }
            this._$message.text(newValue);
            return this;
        }
        return this._$message && this._$message.text() || '';
    };

    ProgressBar.prototype.percentage = function (newValue) {
        if (newValue !== undefined) {
            this._$bar.width(Math.max(Math.min(newValue, 100), 0) + '%');
            return this;
        }
        var width = parseInt(this._$bar[0].style.width, 10);
        return isNaN(width) ? 0 : width;
    };

    ProgressBar.prototype.active = function (newValue) {
        if (newValue !== undefined) {
            this._$progress.toggleClass('active', newValue);
            return this;
        }
        return this._$progress.hasClass('active');
    };

    ProgressBar.prototype.reversed = function (newValue) {
        if (newValue !== undefined) {
            this._$progress.toggleClass('reversed', newValue);
            return this;
        }
        return this._$progress.hasClass('reversed');
    };

    return ProgressBar;
});