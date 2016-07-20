'use strict';

define('bitbucket/internal/util/time', ['aui', 'moment', 'bitbucket/internal/util/text', 'exports'], function (AJS, moment, textUtil, exports) {

    'use strict';

    var hasOwn = Object.prototype.hasOwnProperty;
    var dateFormatCache = {};
    var dateTokenizer = /d{1,2}|'[^']+'|M{1,4}|y{2,4}|h{1,2}|H{1,2}|m{2}|s{2}|S{1,4}|Z{1,2}|z{1,2}|a|:|-|\/|\s+/g;

    function Type(str, isAge) {
        this.key = str;
        this.isAge = isAge;
    }

    Type.types = {};

    var a = ['shortAge', 'longAge', 'short', 'long', 'full', 'timestamp'];
    var l = a.length;
    var i;
    var t;
    for (i = 0; i < l; i++) {
        t = a[i];
        Type.types[t] = new Type(t, t.toLowerCase().indexOf('age') !== -1);
    }

    function getTextForRelativeAge(age, type, param, customMapping) {
        if (customMapping) {
            return getTextForCustomAge(age, param, customMapping);
        }

        return type === Type.types.shortAge ? getTextForShortAge(age, param) : getTextForLongAge(age, param);
    }

    function getTextForShortAge(age, param) {
        // NOTE: AJS cannot be an AMD dependency as the minifier then changes the AJS.I18n.getText references
        // NOTE: and the transformer doesn't do any translation. IMO this is a webresources _bug_ (https://ecosystem.atlassian.net/browse/PLUGWEB-17).
        switch (age) {
            case 'aMomentAgo':
                return AJS.I18n.getText('bitbucket.date.format.short.a.moment.ago');
            case 'oneMinuteAgo':
                return AJS.I18n.getText('bitbucket.date.format.short.one.minute.ago');
            case 'xMinutesAgo':
                return AJS.I18n.getText('bitbucket.date.format.short.x.minutes.ago', param);
            case 'oneHourAgo':
                return AJS.I18n.getText('bitbucket.date.format.short.one.hour.ago');
            case 'xHoursAgo':
                return AJS.I18n.getText('bitbucket.date.format.short.x.hours.ago', param);
            case 'oneDayAgo':
                return AJS.I18n.getText('bitbucket.date.format.short.one.day.ago');
            case 'xDaysAgo':
                return AJS.I18n.getText('bitbucket.date.format.short.x.days.ago', param);
            case 'oneWeekAgo':
                return AJS.I18n.getText('bitbucket.date.format.short.one.week.ago');
            default:
                return null;
        }
    }

    function getTextForLongAge(age, param) {
        // NOTE: AJS cannot be an AMD dependency as the minifier then changes the AJS.I18n.getText references
        // NOTE: and the transformer doesn't do any translation. IMO this is a webresources _bug_ (https://ecosystem.atlassian.net/browse/PLUGWEB-17).
        switch (age) {
            case 'aMomentAgo':
                return AJS.I18n.getText('bitbucket.date.format.long.a.moment.ago');
            case 'oneMinuteAgo':
                return AJS.I18n.getText('bitbucket.date.format.long.one.minute.ago');
            case 'xMinutesAgo':
                return AJS.I18n.getText('bitbucket.date.format.long.x.minutes.ago', param);
            case 'oneHourAgo':
                return AJS.I18n.getText('bitbucket.date.format.long.one.hour.ago');
            case 'xHoursAgo':
                return AJS.I18n.getText('bitbucket.date.format.long.x.hours.ago', param);
            case 'oneDayAgo':
                return AJS.I18n.getText('bitbucket.date.format.long.one.day.ago');
            case 'xDaysAgo':
                return AJS.I18n.getText('bitbucket.date.format.long.x.days.ago', param);
            case 'oneWeekAgo':
                return AJS.I18n.getText('bitbucket.date.format.long.one.week.ago');
            default:
                return null;
        }
    }

    function getTextForCustomAge(age, param, customMapping) {
        switch (age) {
            case 'aMomentAgo':
                return customMapping.aMomentAgo(param);
            case 'oneMinuteAgo':
                return customMapping.oneMinuteAgo(param);
            case 'xMinutesAgo':
                return customMapping.xMinutesAgo(param);
            case 'oneHourAgo':
                return customMapping.oneHourAgo(param);
            case 'xHoursAgo':
                return customMapping.xHoursAgo(param);
            case 'oneDayAgo':
                return customMapping.oneDayAgo(param);
            case 'xDaysAgo':
                return customMapping.xDaysAgo(param);
            case 'oneWeekAgo':
                return customMapping.oneWeekAgo(param);
            default:
                return null;
        }
    }

    function toMomentFormat(javaDateFormat) {
        /*jshint boss:true */
        if (hasOwn.call(dateFormatCache, javaDateFormat)) {
            return dateFormatCache[javaDateFormat];
        }
        var momentDateFormat = "";
        var token;
        dateTokenizer.exec('');
        while (token = dateTokenizer.exec(javaDateFormat)) {
            token = token[0];
            switch (token.charAt(0)) {
                case "'":
                    momentDateFormat += '[' + token.substring(1, token.length - 1) + ']';
                    break;
                case 'd':
                /* falls through */
                case 'y':
                /* falls through */
                case 'a':
                    momentDateFormat += token.toUpperCase();
                    break;
                default:
                    momentDateFormat += token;
            }
        }
        dateFormatCache[javaDateFormat] = momentDateFormat;
        return momentDateFormat;
    }

    function getFormatString(type) {
        /*global date_format: false */
        switch (type.key) {
            case 'short':
            case 'shortAge':
                return date_format('bitbucket.date.format.short');
            case 'long':
            case 'longAge':
                return date_format('bitbucket.date.format.long');
            case 'full':
                return date_format('bitbucket.date.format.full');
            case 'timestamp':
                return date_format('bitbucket.date.format.timestamp');
            default:
                return null;
        }
    }

    // don't call this function directly as it is stubbed by js tests
    function _getTimezoneOffset() {
        var contentElement = document.getElementById("content");
        if (contentElement) {
            return parseInt(contentElement.getAttribute('data-timezone'), 10);
        }
        return 0;
    }

    function getFormattedTimezoneOffset(hourMinuteSeparator, optOffset) {
        var offset = typeof optOffset === 'number' ? optOffset : exports.getTimezoneOffset();
        var abs = Math.abs(offset);
        var hour = Math.floor(abs / 60);
        var minute = abs % 60;
        var ret = '';

        ret += offset <= 0 ? '+' : '-'; // flip the sign
        ret += textUtil.padLeft(hour.toString(), 2, '0');
        ret += hourMinuteSeparator || '';
        ret += textUtil.padLeft(minute.toString(), 2, '0');
        return ret;
    }

    function localiseTimezone(date, optOffset) {
        var converted = date.clone();
        var offset = typeof optOffset === 'number' ? optOffset : exports.getTimezoneOffset();
        if (date.zone() !== offset) {
            // set the time correctly for the new timezone
            converted.add('m', date.zone() - offset);
        }
        return converted;
    }

    function isYesterday(now, date) {
        var end = now.clone().add('d', 1).hours(0).minutes(0).seconds(0).milliseconds(0).subtract('m', date.zone() - exports.getTimezoneOffset());
        while (end > now) {
            end.subtract('d', 1);
        }
        var start = end.clone().subtract('d', 1);
        return start <= date && date < end;
    }

    function getMinutesBetween(start, end) {
        return Math.floor(end.diff(start, 'minutes', true));
    }

    function getHoursBetween(start, end) {
        var hourDiff = end.diff(start, 'hours', true); // Moment's diff does a floor rather than a round so we pass 'true' for a float value
        return Math.round(hourDiff); // Then round it ourself
    }

    function getDaysBetween(start, end) {
        return Math.floor(end.diff(start, 'days', true));
    }

    /**
     * Formats the input date using a named `type`, with an optional offset for timezone handling
     * @param {MomentDate} date - The date to be formatted
     * @param {String} type - either 'shortAge', 'longAge', 'short', 'long', 'full' or 'timestamp'
     * @param {Number} optOffset - the timezone offset
     * @returns {String}
     */
    function formatDateWithFormatString(date, type, optOffset) {
        var offset = typeof optOffset === 'number' ? optOffset : exports.getTimezoneOffset();

        var localisedDate = localiseTimezone(date, offset);

        //We need to replace timezones with the timezone from exports.getTimezoneOffset(), which moment can't do.
        var formatString = toMomentFormat(getFormatString(type)).replace(/Z+/g, function (input) {
            //intentional simplification: treat three or more Zs as ZZ.
            return '[' + getFormattedTimezoneOffset(input.length === 1 ? '' : ':', offset) + ']';
        });

        return localisedDate.format(formatString);
    }

    /**
     * Compares the input date to the current date and returns a relative time
     * @param {MomentDate} date - The date to compare against
     * @param {String} type - either 'shortAge', 'longAge', 'short', 'long', 'full' or 'timestamp'
     * @param {MomentDate} now - the current date, or creates a new moment() instance with the current date.
     * @param {Object} customMapping - and object with methods that override the standard relative age i18n strings
     * @returns {String}
     */
    function formatDateWithRelativeAge(date, type, now, customMapping) {
        now = now || moment();

        if (date <= now) {
            if (date > now.clone().subtract('m', 1)) {
                return getTextForRelativeAge('aMomentAgo', type, null, customMapping);
            } else if (date > now.clone().subtract('m', 2)) {
                return getTextForRelativeAge('oneMinuteAgo', type, null, customMapping);
            } else if (date > now.clone().subtract('m', 50)) {
                return getTextForRelativeAge('xMinutesAgo', type, getMinutesBetween(date, now), customMapping);
            } else if (date > now.clone().subtract('m', 90)) {
                return getTextForRelativeAge('oneHourAgo', type, null, customMapping);
            } else if (isYesterday(now, date) && date < now.clone().subtract('h', 5)) {
                return getTextForRelativeAge('oneDayAgo', type, null, customMapping);
            } else if (date > now.clone().subtract('d', 1)) {
                return getTextForRelativeAge('xHoursAgo', type, getHoursBetween(date, now), customMapping);
            } else if (date > now.clone().subtract('d', 7)) {
                return getTextForRelativeAge('xDaysAgo', type, Math.max(getDaysBetween(date, now), 2), customMapping); // if it's not yesterday then don't say it's one day ago
            } else if (date > now.clone().subtract('d', 8)) {
                    return getTextForRelativeAge('oneWeekAgo', type, null, customMapping);
                }
        }
        return formatDateWithFormatString(date, type);
    }

    function formatDate(momentDate, type, customMapping) {
        if (momentDate && type) {
            if (type.isAge) {
                return formatDateWithRelativeAge(momentDate, type, null, customMapping);
            } else {
                return formatDateWithFormatString(momentDate, type);
            }
        } else {
            return null;
        }
    }

    /**
     * Converts a date into a specified format
     * @param {Date|Number|String} dateOrNumberOrString - the date to format. Supports all formats in {@link http://momentjs.com/docs/#/parsing/|moment.js}
     * @param {String} typeString - either 'shortAge', 'longAge', 'short', 'long', 'full' or 'timestamp'
     * @param {Object} customMapping - and object with methods that override the standard relative age i18n strings
     * @returns {String}
     */
    exports.format = function (dateOrNumberOrString, typeString, customMapping) {
        return formatDate(dateOrNumberOrString ? moment(dateOrNumberOrString) : null, Type.types[typeString], customMapping);
    };

    exports.formatDateWithFormatString = formatDateWithFormatString;
    exports.formatDateWithRelativeAge = formatDateWithRelativeAge;
    exports.FormatType = Type;
    exports.getTimezoneOffset = _getTimezoneOffset;
});