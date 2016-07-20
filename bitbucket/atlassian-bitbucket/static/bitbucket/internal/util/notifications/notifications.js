'use strict';

define('bitbucket/internal/util/notifications', ['aui/flag', 'jquery', 'lodash', 'bitbucket/internal/util/client-storage', 'exports'], function (auiFlag, $, _, clientStorage, exports) {

    'use strict';

    var STORAGE_KEY = 'page-load-notifications';
    var POLLING_STORAGE_KEY = STORAGE_KEY + '-polling-';

    function load() {
        var notifications = clientStorage.getFlashItem(STORAGE_KEY);
        clientStorage.removeFlashItem(STORAGE_KEY);
        return notifications;
    }

    function save(items) {
        if (items && items.length) {
            clientStorage.setFlashItem(STORAGE_KEY, items);
        } else {
            clientStorage.removeFlashItem(STORAGE_KEY);
        }
    }

    function getItem(key) {
        var value;
        var items = load();

        if (items && _.has(items, key)) {
            value = items[key];
            delete items[key];
        }
        save(items);
        return value || null;
    }

    /**
     * Add a notification to be displayed later. This is usually called right before a redirect.
     *
     * @param {string} title    the flag title to be displayed
     * @param {Object?} options any optional configurations:
     *                          body: if not specified no body is displayed
     *                          type: if not specified it defaults to 'success'
     *                          close: if not specified it defaults to 'auto'
     */
    exports.addFlash = function (title, options) {
        var items = load() || [];
        options = options || {};
        items.push({
            title: title,
            body: options.body,
            type: options.type || 'success',
            close: options.close || 'auto'
        });
        save(items);
    };

    /**
     * Show notification as soon as the document is ready
     *
     * @param {Object} contains options for creating an auiFlag (see https://docs.atlassian.com/aui/latest/docs/flag.html)
     *                 title or body is required
     */
    exports.showOnReady = function (options) {
        if (options.title || options.body) {
            $(document).ready(function () {
                auiFlag(options);
            });
        }
    };

    /**
     * Drain all stored notifications and attach them to the container.
     *
     * @param {HTMLElement|jQuery|String} container the container to attach the notifications to.
     * @param {String?} attachmentMethod jQuery method to call to attach the notification to the container.
     *                                   'html', 'append', 'prepend', 'before' and 'after' will all work.
     *                                   If not specified it defaults to 'append'
     */
    exports.showFlashes = function () {
        _.each(exports._drainNotifications(), function (notification) {
            auiFlag(notification);
        });
    };

    var pollingNotificationNames = POLLING_STORAGE_KEY + 'names';
    var pollingNotificationNamesToDelete = Array.isArray(clientStorage.getItem(pollingNotificationNames)) && clientStorage.getItem(pollingNotificationNames) || [];

    exports._clearPollingNotifications = function (notificationsToClear) {
        notificationsToClear.forEach(function (notificationName) {
            var key = POLLING_STORAGE_KEY + notificationName;
            clientStorage.removeItem(key);
        });
    };

    setTimeout(function () {
        exports._clearPollingNotifications(pollingNotificationNamesToDelete);
    }, 5000);

    function updatePollingNotificationNamesToDelete(notificationName) {
        var index = pollingNotificationNamesToDelete.indexOf(notificationName);
        if (index < 0) {
            pollingNotificationNamesToDelete.push(notificationName);
            clientStorage.setItem(pollingNotificationNames, pollingNotificationNamesToDelete);
        } else {
            pollingNotificationNamesToDelete.splice(index, 1);
        }
    }

    function trackedFlag(item, key) {
        item.body += bitbucket.internal.util.notifications.closePollingFlag();
        var flag = auiFlag(item);
        $(flag).find('.close').on('click', function () {
            flag.close();
            item.closed = true;
            clientStorage.setItem(key, item);
        });
    }

    /**
     * An auiFlag notification that will:
     * - keep appearing until the user clicks the close link
     * - respect being closed until the next occurrence after a clean page load
     *
     * @param {string} notificationName the key for local storage (gets prepended)
     * @param {Object} flagOptions object with the options for an auiFlag (standard auiFlag defaults apply)
     */
    exports.polling = function (notificationName, flagOptions) {
        updatePollingNotificationNamesToDelete(notificationName);

        var key = POLLING_STORAGE_KEY + notificationName;
        var item = clientStorage.getItem(key);

        if (!item) {
            item = _.extend(flagOptions, {
                closed: false
            });
            clientStorage.setItem(key, item);
        }
        if (!item.closed) {
            trackedFlag(item, key);
        }
    };

    /**
     * drain the currently stored notifications.
     * @private
     * @returns {Array<Object>} the notifications
     */
    exports._drainNotifications = function () {
        return load();
    };
});