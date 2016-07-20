'use strict';

define('bitbucket/internal/feature/file-content/stash-codemirror/stash-scrollbar', ['codemirror', 'jquery', 'lodash', 'bitbucket/internal/util/navigator'], function (CodeMirror, $, _, navigatorUtil) {

    function generateStashScrollbars(opts) {

        /**
         * Creates the scrollbar, called by CodeMirror on initialisation or when the scrollbar style is changed.
         *
         * @param {Function<HTMLElement>} place    - A function to call to place the scrollbar element inside .CodeMirror.
         * @param {Function<number,string>} scroll - A function to call when a scroll event happens on the scrollbar.
         * @param {CodeMirror} cm                  - The CodeMirror instance that owns this scrollbar.
         * @constructor
         */
        function StashScrollbars(place, scroll, cm) {
            this._cm = cm;
            this._scroll = scroll;

            _.bindAll(this, 'clear', 'onScroll');

            this.$barEl = $(bitbucket.internal.feature.fileContent.codemirror.scrollbar({
                isMac: navigatorUtil.isMac(),
                fixed: opts.fixed
            }));
            this.$innerEl = this.$barEl.find('div');

            if (opts.fixed) {
                $('body').append(this.$barEl);

                // need to attach our own remove handler because we are putting our element outside the `.CodeMirror` element.
                cm.getOption('stashDestroyables').push({ destroy: this.clear });
            } else {
                // CodeMirror wants the raw DOM node
                place(this.$barEl[0]);
            }

            this.$barEl.on("scroll", this.onScroll);
        }

        /**
         * Called by CodeMirror to clear the scrollbar when switching to a new style.
         */
        StashScrollbars.prototype.clear = function () {
            this.$barEl.remove();
        };

        /**
         * Event handler for scroll events on our scrollbar
         */
        StashScrollbars.prototype.onScroll = function () {
            var barEl = this.$barEl[0];
            if (barEl.clientWidth) {
                this._scroll(barEl.scrollLeft, "horizontal");
            }
        };

        /**
         * Called by CodeMirror when the CodeMirror is scrolled.
         *
         * @param {number} pos - the new position the scroll bar should move to.
         */
        StashScrollbars.prototype.setScrollLeft = function (pos) {
            if (this.$barEl.scrollLeft() !== pos) {
                this.$barEl.scrollLeft(pos);
            }
        };

        /**
         * Called by CodeMirror when the CodeMirror is scrolled.
         *
         * StashScrollbars doesn't do vertical scrolling so this is ignored.
         */
        StashScrollbars.prototype.setScrollTop = function (pos) {};

        /**
         * Called by CodeMirror when it thinks the scrollbar might need to resize.
         *
         * @param {Object} measure
         * @param {number} measure.barLeft
         * @param {number} measure.clientHeight
         * @param {number} measure.clientWidth
         * @param {number} measure.docHeight
         * @param {number} measure.gutterWidth
         * @param {number} measure.nativeBarWidth
         * @param {number} measure.scrollHeight
         * @param {number} measure.scrollWidth
         * @param {number} measure.viewHeight
         * @param {number} measure.viewWidth
         * @returns {{right: number, bottom: *}}
         */
        StashScrollbars.prototype.update = function (measure) {
            // skip updates when nothing important has changed.
            // CodeMirror calls this method after scrolling happens when it doesn't need to.
            if (_.isEqual(measure, this.lastMeasure)) {
                return this.lastUpdateResult;
            }
            this.lastMeasure = measure;

            var needsScrollbar = measure.scrollWidth > measure.clientWidth + 1;

            var barStyle = {};
            var innerStyle = {};

            if (needsScrollbar) {
                barStyle.display = "block";
                barStyle.width = measure.viewWidth + "px";

                if (opts.fixed) {
                    barStyle.left = this._cm.getWrapperElement().getBoundingClientRect().left + "px";
                } else {
                    barStyle.right = "0";
                }
                innerStyle.width = measure.scrollWidth - measure.clientWidth + measure.viewWidth + "px";
            } else {
                barStyle.display = "";
                innerStyle.width = "0";
            }
            this.$barEl.css(barStyle);
            this.$innerEl.css(innerStyle);

            this.lastUpdateResult = { right: 0, bottom: needsScrollbar ? measure.nativeBarWidth : 0 };
            return this.lastUpdateResult;
        };

        return StashScrollbars;
    }

    CodeMirror.scrollbarModel['stash-inline'] = generateStashScrollbars({
        fixed: false
    });
    CodeMirror.scrollbarModel['stash-fixed'] = generateStashScrollbars({
        fixed: true
    });
});