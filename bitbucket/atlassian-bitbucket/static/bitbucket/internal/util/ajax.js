'use strict';

define('bitbucket/internal/util/ajax', ['jquery', 'lodash', 'bitbucket/util/server', 'bitbucket/internal/util/error', 'exports'], function ($, _, server, errorUtil, exports) {

    'use strict';

    // turn form inputs into [{name:'blah', value:'blah'}, ...] with serializeArray,
    // then into { blah: 'blah', ...} via reduce

    function formToJSON($form) {
        // Find all the checked checkboxes with the value 'on' and store them in an object
        var checkboxes = _.reduce($form.find('input[type=checkbox]:checked'), function (obj, entry) {
            var $entry = $(entry);
            // Only process checkboxes with 'on' which is the default for Chrome/Firefox/IE9
            if ($entry.attr('value') === 'on') {
                obj[$entry.attr('name')] = true;
            }
            return obj;
        }, {});
        return _.reduce($form.serializeArray(), function (obj, entry) {
            //paraphrased from http://stackoverflow.com/a/1186309/37685

            var existingVal = obj[entry.name];
            var newVal = entry.value === undefined ? '' : entry.value;

            // Override the checkbox value (most likely 'on') with true
            if (checkboxes[entry.name]) {
                newVal = true;
            }

            if (existingVal !== undefined) {
                // make it an array if it's not, since we have multiple values.
                if (!$.isArray(existingVal)) {
                    obj[entry.name] = [existingVal];
                }

                // add the new value to the array
                obj[entry.name].push(newVal);
            } else {
                obj[entry.name] = newVal;
            }

            return obj;
        }, {
            //seed with new object
        });
    }

    exports.ignore404WithinRepository = function (callback) {
        return {
            '404': function _(xhr, testStatus, errorThrown, data, fallbackError) {

                var error = data && data.errors && data.errors.length && data.errors[0];

                if (errorUtil.isErrorEntityWithinRepository(error)) {
                    return callback && callback(data) || false; // don't handle this globally.
                }
            }
        };
    };

    exports.ajax = server.ajax;
    exports.rest = server.rest;
    exports.poll = server.poll;
    exports.formToJSON = formToJSON;
});