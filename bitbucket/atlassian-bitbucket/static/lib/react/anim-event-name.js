/*
 * Modified by Atlassian:
 * - split into separate funcs for transition / animation
 * - other code irrelevant to determining end event name has been removed.
 * - CommonJS code removed and wrapped in an AMD module
 *
 * Original source:
 * https://github.com/facebook/react/blob/master/src/addons/transitions/ReactTransitionEvents.js
 *
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define('lib/react/anim-event-name', [
    'exports'
], function (
    exports
) {

    /**
     * Returns the transition end event name supported by this browser
     */
    var transitionEndEventName = function() {

        var eventMap = {
            'transition': 'transitionend',
            'WebkitTransition': 'webkitTransitionEnd',
            'MozTransition': 'mozTransitionEnd',
            'OTransition': 'oTransitionEnd',
            'msTransition': 'MSTransitionEnd'
        };

        // On some platforms, in particular some releases of Android 4.x,
        // the un-prefixed "animation" and "transition" properties are defined on the
        // style object but the events that fire will still be prefixed, so we need
        // to check if the un-prefixed events are useable, and if not remove them
        // from the map
        if (!('TransitionEvent' in window)) {
            delete eventMap.transition;
        }

        for (var styleName in eventMap) {
            if (styleName in document.body.style) {
                return eventMap[styleName];
            }
        }
    };

    /**
     * Returns the animation end event name supported by this browser
     */
    var animationEndEventName = function() {

        var eventMap = {
            'animation': 'animationend',
            'WebkitAnimation': 'webkitAnimationEnd',
            'MozAnimation': 'mozAnimationEnd',
            'OAnimation': 'oAnimationEnd',
            'msAnimation': 'MSAnimationEnd'
        };

        // On some platforms, in particular some releases of Android 4.x,
        // the un-prefixed "animation" and "transition" properties are defined on the
        // style object but the events that fire will still be prefixed, so we need
        // to check if the un-prefixed events are useable, and if not remove them
        // from the map
        if (!('AnimationEvent' in window)) {
            delete eventMap.animation;
        }

        for (var styleName in eventMap) {
            if (styleName in document.body.style) {
                return eventMap[styleName];
            }
        }
    };

    exports.transitionEndEventName = transitionEndEventName;
    exports.animationEndEventName = animationEndEventName;
});