'use strict';

define('bitbucket/internal/feature/file-content/diff-hunk-map', ['jquery', 'lodash', 'bitbucket/internal/util/function', 'bitbucket/internal/util/math', 'bitbucket/internal/util/scroll'],
/**
 * The Diff Hunkmap will add an SVG hunk map to a given DOM element based on a set of diff hunk and segment information.
 * @exports bitbucket/internal/feature/file-content/diff-hunkmap
 */
function ($, _, fn, math, scrollUtil) {

    'use strict';

    /**
     * These colours match up with our LESS colour variables
     *
     * @type {{CONTEXT: string, ADDED: string, REMOVED: string, CONFLICT: string}}
     */

    var segmentColours = {
        CONTEXT: '#ffffff',
        ADDED: '#97f295', // @addedLineColorEdiff
        REMOVED: '#ffb6ba', // @deletedLineColorEdiff
        CONFLICT: '#FFF986' // @conflictLineColorEdiff
    };

    /**
     * Instantiate a DiffHunkMap
     *
     * @param {HTMLElement} container - hunk map will get appended to this.
     * @param {Object}      regions   - The regions for the diff we're building a hunk map to.
     * @param {Object}      options
     *
     * @constructor
     */
    function DiffHunkMap(container, regions, options) {
        this.init.apply(this, arguments);
    }

    /**
     * Add a canvas and perform the initial redraw of the hunk map
     *
     * @param {HTMLElement} container
     * @param {Object} regions
     * @param {Object} options
     */
    DiffHunkMap.prototype.init = function (container, regions, options) {
        this.regions = regions;
        this.options = $.extend({}, options);
        this.$hunkMap = $(bitbucket.internal.feature.fileContent.diffHunkMap()).appendTo(container);
        this.hunkMapWidth = this.$hunkMap.width();

        this.$indicator = $(bitbucket.internal.feature.fileContent.diffHunkMapViewportIndicator()).appendTo(this.$hunkMap);
        this.indicatorScroll = scrollUtil.fakeScroll(this.$indicator[0], { withDocument: true });

        this.addCanvas(math.Size(this.hunkMapWidth, this.$hunkMap.height()));
        this.redraw();

        if (typeof this.options.scrollToFn === 'function') {
            this.$hunkMap.on('click', this._hunkMapClicked.bind(this, this.options.scrollToFn));
        }
    };

    DiffHunkMap.prototype.setIndicator = function () {
        var indicatorHeight = this.hunkMapHeight * (this.hunkMapHeight / this.totalHeight);

        // Note: The hunk map could be a 0 height if a side-by-side diff is made up of only added/removed lines.
        var isFullHeight = this.hunkMapHeight === 0 || indicatorHeight === this.hunkMapHeight;
        this.$indicator.toggleClass('hidden', isFullHeight); // make the indicator visible when it is smaller than the hunk map

        if (isFullHeight) {
            return;
        }
        this.$indicator.height(indicatorHeight);
    };

    /**
     * The callback used for the scroll event on a diff.
     *
     * @param {Object} scrollInfo
     */
    DiffHunkMap.prototype.diffScrolled = function (scrollInfo) {
        var relativePosition = scrollInfo.top / scrollInfo.height;
        this.indicatorScroll(0, relativePosition * this.hunkMapHeight);
    };

    /**
     * Call the scroll function that we were given to pass along the relative position of where the hunk map was clicked
     * @param {Function} scrollToFn
     * @param {Event} e
     * @private
     */
    DiffHunkMap.prototype._hunkMapClicked = function (scrollToFn, e) {
        var clickPosition = e.pageY - this.$hunkMap.offset().top;
        scrollToFn(clickPosition / this.hunkMapHeight);
    };

    /**
     * Calculates the total height of regions and adds a fraction value to regions that indicates
     * how tall they are as a fraction of the total height of all the regions.
     */
    DiffHunkMap.prototype.mapHeights = function () {
        // Get the total height of the regions for this hunkmap
        var heights = _.invoke(this.regions, 'getHeight');
        var self = this;
        this.totalHeight = heights.reduce(math.add, 0);

        // If the total height of the regions is less than the container height, fix the height to
        // the height of the content. This will be the height of the hunkmap
        this.hunkMapHeight = Math.min(this.$hunkMap.height(), this.totalHeight);

        // work out the fraction represenation of these hunks.
        _.chain(this.regions).zip(heights).forEach(fn.spread(function (region, height) {
            region.fraction = height / self.totalHeight;
        })).value();
    };

    /**
     * Return the colour that will be used to indicate this segment.
     *
     * @param {Object} region
     * @returns {string}
     */
    function getRegionTypeColour(region) {
        if (region._seg.lines[0].conflictMarker) {
            return segmentColours.CONFLICT;
        }
        return segmentColours[region._seg.type] || segmentColours.CONTEXT;
    }

    /**
     * Add a hunk to the map
     *
     * @param {number} offset
     * @param {Object} region
     *
     * @returns {number}
     */
    DiffHunkMap.prototype.addHunkToMap = function (offset, region) {
        if (region.fraction === 0) {
            // This is the placeholder "hunk" for an added/removed hunk on the other side.
            // Let's skip it.
            return offset;
        }

        var height = this.getHunkHeight(region);

        this.setFillStyle(getRegionTypeColour(region));

        this.drawHunk(math.Point(0, offset), math.Size(this.hunkMapWidth, height));

        return offset + height;
    };

    /**
     * Get the height for a hunk in the hunkmap
     *
     * @param {Object} region
     *
     * @returns {number}
     */
    DiffHunkMap.prototype.getHunkHeight = function (region) {
        return Math.max(region.fraction * this.hunkMapHeight, 1); //enforce a minimum height on hunks in the map
    };

    /**
     * Clear the hunkmap
     */
    DiffHunkMap.prototype.clear = function () {
        this.canvasContext.clearRect(0, 0, this.hunkMapWidth, this.hunkMapHeight);
    };

    /**
     * Draw the hunkmap
     */
    DiffHunkMap.prototype.draw = function () {
        this.$canvas.attr('height', this.hunkMapHeight);
        // Add all the regions to the hunkmap
        this.regions.reduce(this.addHunkToMap.bind(this), 0);
        this.setIndicator();
    };

    /**
     * Clears and redraws the hunkmap
     */
    DiffHunkMap.prototype.redraw = function () {
        this.clear();
        this.mapHeights();
        this.draw();
    };

    /**
     * Add the canvas element to the DOM and grab a reference to the context
     *
     * @param {math.Size} size
     */
    DiffHunkMap.prototype.addCanvas = function (size) {
        this.$canvas = $(bitbucket.internal.feature.fileContent.diffHunkMapCanvas({ size: size })).appendTo(this.$hunkMap);
        this.canvasContext = this.$canvas[0].getContext('2d');
    };

    /**
     * Set the fillStyle for the next time a fillRect call is made to canvas
     * Colours are expected to be CSS3 colours (as per canvas spec.)
     *
     * @param {string} colour
     */
    DiffHunkMap.prototype.setFillStyle = function (colour) {
        this.canvasContext.fillStyle = colour;
    };

    /**
     * Draw a hunk on the hunkmap canvas.
     *
     * @param {math.Point} at - position of the hunk representation
     * @param {math.Size} size
     */
    DiffHunkMap.prototype.drawHunk = function (at, size) {
        this.canvasContext.fillRect(at.x, at.y, size.width, size.height);
    };

    /**
     * Destroy. Remove the container
     */
    DiffHunkMap.prototype.destroy = function () {
        this.$hunkMap.remove();
    };

    return DiffHunkMap;
});