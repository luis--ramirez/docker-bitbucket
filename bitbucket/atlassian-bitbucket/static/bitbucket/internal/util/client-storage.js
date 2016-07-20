'use strict';

define('bitbucket/internal/util/client-storage', ['jquery', 'lodash', 'bitbucket/internal/model/page-state', 'bitbucket/internal/util/feature-detect', 'exports'], function ($, _, pageState, featureDetect, exports) {

    'use strict';

    /**
     * Types of storage.
     * @readonly
     * @enum {string}
     */

    var storageType = {
        SESSION: 'session',
        LOCAL: 'local'
    };

    var FLASH_PREFIX = '_flash.';

    var componentDelimiter = "_";
    var cleanupKey = 'lastCleanup';
    var hasCheckedCleanUpKey = 'hasCheckedCleanUp';
    var oneWeek = 1000 * 60 * 60 * 24 * 7;
    var fourWeeks = 4 * oneWeek;

    var dummy = {};
    // Visible for testing
    exports._resetDummy = function () {
        dummy = {};
    };

    /**
     * Build a key for use in client storage
     * @param {string[]|string} components a string or array of strings to build into a key for client storage.
     * @param {string} [context] One of 'pull-request', 'repo', 'project', or 'user' for scoping the key. Each is progressively more weakly scoped than the previous.
     * @return {string} key
     */
    function buildKey(components, context) {
        if (_.isString(components)) {
            components = [components];
        }

        if (!_.isArray(components)) {
            throw new Error('keyBuilder requires an array of components');
        }

        if (context) {
            // Add the context to the key
            components.push(context);

            // This switch falls through each level adding progressively more detail the higher up you start
            // e.g. the user context just adds the current user's username,
            // but `pull-request` adds the pull request id, the repo slug, the project key and the current username
            // This may need refactoring if we introduce new contexts that don't fit into this waterfall.
            switch (context) {
                case 'pull-request':
                    components.push(pageState.getPullRequest() && pageState.getPullRequest().getId());
                /* falls through */
                case 'repo':
                    components.push(pageState.getRepository() && pageState.getRepository().getSlug());
                /* falls through */
                case 'project':
                    components.push(pageState.getProject() && pageState.getProject().getKey());
                /* falls through */
                case 'user':
                    components.push(pageState.getCurrentUser() && pageState.getCurrentUser().getName());
                    break;
            }
        }

        return components.join(componentDelimiter);
    }

    /**
     * Get an item directly from client storage, without the clientStorage wrapping/unwrapping being applied.
     * The item will be JSON.parse'd if appropriate.
     * @param {string} key the identifier of the item to retrieve from storage
     * @param {string} [type='local'] one of 'local' or 'session' to get the value from.
     * @return {*}
     */
    function getRawItem(key, type) {
        //Get the entire JSON object from localStorage.
        //Use if you want to access the metadata of an entry
        var rawItem;
        var item;

        if (featureDetect.localStorage()) {
            rawItem = window[(type || storageType.LOCAL) + "Storage"].getItem(key);
        } else {
            rawItem = _.has(dummy, key) ? dummy[key] : null;
        }

        try {
            item = JSON.parse(rawItem);
        } catch (exception) {
            item = rawItem;
        }

        return item;
    }

    /**
     * Get an item from client storage, invoking JSON and clientStorage-specific unwrapping transforms on it.
     * @param {string} key the identifier of the item to retrieve from storage
     * @param {string} [type='local'] one of 'local' or 'session' to get the value from.
     * @return {*}
     */
    function getItem(key, type) {
        //Return the `data` attribute of the JSON object stored in localStorage, or the raw value if it's not wrapped in a object.
        //`type` is LOCAL by default
        var item = getRawItem(key, type);
        return $.isPlainObject(item) && _.has(item, 'data') ? item.data : item;
    }

    /**
     * Get an item from sessionStorage, invoking JSON and clientStorage-specific unwrapping transforms on it.
     * @param {string} key the identifier of the item to retrieve from storage
     * @return {*}
     */
    function getSessionItem(key) {
        return getItem(key, storageType.SESSION);
    }

    /**
     * Get a flash item (from sessionStorage), invoking JSON and clientStorage-specific unwrapping transforms on it.
     * The item will be removed from storage and won't be available when next requested.
     * @param {string} key the identifier of the item to retrieve from storage
     * @return {*}
     */
    function getFlashItem(key) {
        var val = getItem(FLASH_PREFIX + key, storageType.SESSION);
        removeFlashItem(key);
        return val;
    }

    /**
     * Set an item in client storage, invoking only a JSON.stringify transform on it.
     * @param {string} key the identifier for this item in storage
     * @param {*} obj the object to store. Note that circular references within the object, or DOM objects will cause this method to throw errors.
     * @param {string} [type='local'] one of 'local' or 'session' to set the value in.
     */
    function setRawItem(key, obj, type) {
        //Save the object as is to client storage, don't add meta data
        if (featureDetect.localStorage()) {
            try {
                window[(type || storageType.LOCAL) + "Storage"].setItem(key, JSON.stringify(obj));
            } catch (e) {
                if (e.code === 22 || e.code === 1014) {
                    // 22 - the correct code most browsers use
                    // 1014 - Firefox's code
                    console.warn('WARN: Ran out of space in localStorage');
                    if (doCleanup()) {
                        setRawItem(key, obj, type);
                    }
                } else {
                    throw e;
                }
            }
        } else {
            dummy[key] = JSON.stringify(obj);
        }
    }

    /**
     * Set an item in client storage, invoking JSON and clientStorage-specific wrapping transforms on it.
     * @param {string} key the identifier for this item in storage
     * @param {*} obj the object to store. Note that circular references within the object, or DOM objects will cause this method to throw errors.
     * @param {Object} [extraProperties] Extra metadata to store about the object that will not be returned with it.
     * @param {boolean} [extraProperties.noCleanup] If specified as true, this object will not be cleaned up after a month.
     * @param {string} [type='local'] one of 'local' or 'session' to set the value in.
     */
    function setItem(key, obj, extraProperties, type) {
        //Don't allow extraProperties to overwrite the core attributes, `data` and `timestamp`;
        //Currently the only useful extraProperty is Boolean `noCleanup`
        //`type` is LOCAL by default
        var item = _.extend({}, extraProperties, {
            timestamp: new Date().getTime(),
            data: obj
        });

        setRawItem(key, item, type);

        if (!type || type === storageType.LOCAL) {
            //Defer cleanup task until after the calling code has finished executing
            _.defer(checkCleanup);
        }
    }

    /**
     * Set an item in sessionStorage, invoking JSON and clientStorage-specific wrapping transforms on it.
     * @param {string} key the identifier for this item in storage
     * @param {*} obj the object to store. Note that circular references within the object, or DOM objects will cause this method to throw errors.
     * @param {Object} [extraProperties] Extra metadata to store about the object that will not be returned with it.
     * @param {boolean} [extraProperties.noCleanup] If specified as true, this object will not be cleaned up after a month. This is not very useful for session storage.
     */
    function setSessionItem(key, obj, extraProperties) {
        setItem.call(this, key, obj, extraProperties, storageType.SESSION);
    }

    /**
     * Set a flash item's value (in sessionStorage), invoking JSON and clientStorage-specific wrapping transforms on it.
     * @param {string} key the identifier for this item in storage
     * @param {*} obj the object to store. Note that circular references within the object, or DOM objects will cause this method to throw errors.
     * @param {Object} [extraProperties] Extra metadata to store about the object that will not be returned with it.
     * @param {boolean} [extraProperties.noCleanup] If specified as true, this object will not be cleaned up after a month. This is not very useful for flash storage.
     */
    function setFlashItem(key, obj, extraProperties) {
        setItem.call(this, FLASH_PREFIX + key, obj, extraProperties, storageType.SESSION);
    }

    /**
     * Remove an item from client storage.
     * @param {string} key the identifier for which item to remove
     * @param {string} [type='local'] one of 'local' or 'session' to remove the value from
     */
    function removeItem(key, type) {
        if (featureDetect.localStorage()) {
            window[(type || storageType.LOCAL) + "Storage"].removeItem(key);
        } else {
            delete dummy[key];
        }
    }

    /**
     * Remove an item from sessionStorage.
     * @param {string} key the identifier for which item to remove
     */
    function removeSessionItem(key) {
        removeItem(key, storageType.SESSION);
    }

    /**
     * Remove a flash item (from sessionStorage).
     * @param {string} key the identifier for which item to remove
     */
    function removeFlashItem(key) {
        removeItem(FLASH_PREFIX + key, storageType.SESSION);
    }

    function checkCleanup() {
        if (getRawItem(hasCheckedCleanUpKey, storageType.SESSION)) {
            //Short circuit if we have already checked for cleanup this page/session
            return;
        }

        var lastCleanup = getRawItem(cleanupKey);

        if (!lastCleanup || new Date().getTime() - lastCleanup > fourWeeks) {
            doCleanup();
        }

        setRawItem(hasCheckedCleanUpKey, true, storageType.SESSION); //Prevent reruns of the cleanup check for the life of this session
    }

    function doCleanup(minAge) {
        minAge = minAge || fourWeeks;
        var currTime = new Date().getTime();
        var numKeysBefore = Object.keys(localStorage).length;
        Object.keys(localStorage).forEach(function (key) {
            if (key !== cleanupKey) {
                //don't cleanup the cleanup tracker
                var item = getRawItem(key);
                if (item && item.timestamp && !item.noCleanup && currTime - item.timestamp > minAge) {
                    removeItem(key);
                }
            }
        });
        setRawItem(cleanupKey, new Date().getTime());
        var itemsRemoved = numKeysBefore - Object.keys(localStorage).length;
        if (!itemsRemoved && minAge - oneWeek >= oneWeek) {
            return doCleanup(minAge - oneWeek);
        }
        return itemsRemoved;
    }

    exports._doCleanup = doCleanup;
    exports.LOCAL = storageType.LOCAL;
    exports.SESSION = storageType.SESSION;
    exports.buildKey = buildKey;
    exports.getItem = getItem;
    exports.getFlashItem = getFlashItem;
    exports.getSessionItem = getSessionItem;
    exports.setItem = setItem;
    exports.setFlashItem = setFlashItem;
    exports.setSessionItem = setSessionItem;
    exports.removeItem = removeItem;
    exports.removeFlashItem = removeFlashItem;
    exports.removeSessionItem = removeSessionItem;
});