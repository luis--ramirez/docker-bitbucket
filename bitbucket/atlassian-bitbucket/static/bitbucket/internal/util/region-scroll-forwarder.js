'use strict';

define('bitbucket/internal/util/region-scroll-forwarder', ['bacon', 'jquery', 'lodash', 'bitbucket/internal/util/bacon', 'bitbucket/internal/util/function'],
/**
 * Forward scroll events from a source to one or many targets
 *
 * @exports bitbucket/internal/util/region-scroll-forwarder
 */
function (Bacon, $, _, baconUtil, fn) {
    'use strict';

    /**
     * Given a scroll property to listen to, determines the region that we're in and forwards scroll events.
     * When leaving a region, that region will be scrolled to the 'near' edge.
     * Allows for 'grouped' regions and will only scroll the 'nearest' region in each group to the edge.
     * This is useful when disjoint regions are actually forwarding to the same underlying object. E.g.
     *
     * ------------------- top
     * |
     * | region A - scroll the window while we're in this region
     * |
     * |-----
     * |
     * | region B - scroll an internal div while we're in this region
     * |
     * |-----
     * |
     * | region C - scroll the window while we're in this region
     * |
     * ------------------- bottom
     *
     * When a scroll event jumps from region A to C (e.g. user pressed PgDn), there is no need to scroll
     * A to the edge, because C will be affecting the window more accurately. But region B affects a different
     * element, so must be scrolled to the edge.
     *
     * @param {Bacon.Property} scrollProperty - Bacon Property that emits { top : number }
     * @param {Array<{setScrollTop : function(number), getHeight : function() : number, groupId : * }>} regions
     */

    function RegionScrollForwarder(scrollProperty, regions) {
        var destroyed = new Bacon.Bus();

        regions = regions.map(function (region) {
            var cachedHeight = null;
            return $.extend({}, region, {
                getCachedHeight: function getCachedHeight() {
                    if (cachedHeight == null) {
                        cachedHeight = region.getHeight();
                    }
                    return cachedHeight;
                },
                invalidateCache: function invalidateCache() {
                    cachedHeight = null;
                }
            });
        });

        var latestForwardingInfo;

        // Subscribe to the scrollProperty so we can set the initial scrollTop for regions
        scrollProperty.subscribe(function (e) {
            // Only operate on the initial event.
            if (!e.isInitial()) {
                return;
            }

            var initialScroll = e.value().top;
            var offset = 0;
            var currentRegion;

            // set the scrollTop for all regions
            _.forEach(regions, function (region) {
                var height = region.getCachedHeight();
                var isBelow = offset + height >= initialScroll;

                if (!currentRegion && isBelow) {
                    currentRegion = region;
                    region.setScrollTop(initialScroll - offset);
                } else {
                    region.setScrollTop(isBelow ? 0 : height);
                }
                offset += height;
            });
        })(); // invoke to unsub straight away

        var forwardingInfo = scrollProperty.takeUntil(destroyed).slidingWindow(2, 2).map(fn.spread(function (previousScrollInfo, scrollInfo) {
            var offset = 0;
            var prevRegion;
            var diff = scrollInfo.top - previousScrollInfo.top;
            var region;

            var offsetSoFar = 0;
            _.some(regions, function (currentRegion) {
                var height = currentRegion.getCachedHeight();
                if (!region && offsetSoFar + height >= scrollInfo.top) {
                    region = currentRegion;
                    offset = offsetSoFar;
                }
                if (!prevRegion && offsetSoFar + height >= previousScrollInfo.top) {
                    prevRegion = currentRegion;
                }
                offsetSoFar += height;
                return region && prevRegion;
            });
            if (!region) {
                throw new Error("No forwardee handles " + scrollInfo.top);
            }
            var info = {
                scrollInfo: scrollInfo,
                localTop: scrollInfo.top - offset,
                diff: diff,
                forwardTo: region,
                previousRegion: prevRegion
            };
            return info;
        }));

        function scrollRegionsToEdge(regions, getEdge) {
            _.chain(regions).filter(function (region, i, regions) {
                // unique by groupId, ensuring first region is chosen
                return !_.some(regions.slice(0, i), function (otherInfo) {
                    return region.groupId && region.groupId === otherInfo.groupId;
                });
            }).forEach(function (region) {
                region.setScrollTop(getEdge(region) === 'bottom' ? region.getCachedHeight() : 0);
            }).value();
        }

        var stopForwarding = forwardingInfo.onValue(function (forwardingInfo) {
            latestForwardingInfo = forwardingInfo;

            var forwardToRegion = forwardingInfo.previousRegion;
            // scroll all the regions between now and last time to their closest edge
            if (forwardToRegion !== forwardingInfo.forwardTo) {

                var betweens = baconUtil.toArray(baconUtil.takeBetween(Bacon.fromArray(regions), {
                    start: forwardToRegion,
                    end: forwardingInfo.forwardTo,
                    startInclusive: true,
                    endInclusive: false
                }));

                var scrollingDown = forwardingInfo.diff > 0;
                scrollRegionsToEdge(scrollingDown ? betweens.reverse() : betweens, fn.constant(scrollingDown ? 'bottom' : 'top'));
            }
            forwardingInfo.forwardTo.setScrollTop(forwardingInfo.localTop);
        });

        // Force all regions back to the right place - should have no affect unless offsets have changed.
        // Regions above the currently focused one are scrolled to the bottom.
        // Regions below the currently focused one are scrolled to the top.
        function resetPositions() {
            _.invoke(regions, 'invalidateCache');
            if (latestForwardingInfo) {
                var regionIndex = _.indexOf(regions, latestForwardingInfo.forwardTo);
                scrollRegionsToEdge(_.reject(regions, function (region) {
                    return region === latestForwardingInfo.forwardTo || region.groupId && region.groupId === latestForwardingInfo.forwardTo.groupId;
                }), function (region) {
                    return _.indexOf(regions, region) < regionIndex ? 'bottom' : 'top';
                });
                latestForwardingInfo.forwardTo.setScrollTop(Math.min(latestForwardingInfo.localTop, latestForwardingInfo.forwardTo.getCachedHeight()));
            }
        }

        return {
            regionChanges: forwardingInfo.map('.forwardTo').skipDuplicates(),
            forwardingInfo: forwardingInfo,
            heightsChanged: resetPositions,
            destroy: function destroy() {
                stopForwarding();
                destroyed.push(true);
                destroyed.end();
            }
        };
    }

    return RegionScrollForwarder;
});