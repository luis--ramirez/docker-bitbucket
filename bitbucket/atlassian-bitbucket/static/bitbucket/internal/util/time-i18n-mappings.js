'use strict';

define('bitbucket/internal/util/time-i18n-mappings', ['aui', 'exports'], function (AJS, exports) {

    'use strict';

    var commentEditedAgeMapping = {
        aMomentAgo: function aMomentAgo() {
            return AJS.I18n.getText('bitbucket.date.format.edited.a.moment.ago');
        },
        oneMinuteAgo: function oneMinuteAgo() {
            return AJS.I18n.getText('bitbucket.date.format.edited.one.minute.ago');
        },
        xMinutesAgo: function xMinutesAgo(param) {
            return AJS.I18n.getText('bitbucket.date.format.edited.x.minutes.ago', param);
        },
        oneHourAgo: function oneHourAgo() {
            return AJS.I18n.getText('bitbucket.date.format.edited.one.hour.ago');
        },
        xHoursAgo: function xHoursAgo(param) {
            return AJS.I18n.getText('bitbucket.date.format.edited.x.hours.ago', param);
        },
        oneDayAgo: function oneDayAgo() {
            return AJS.I18n.getText('bitbucket.date.format.edited.one.day.ago');
        },
        xDaysAgo: function xDaysAgo(param) {
            return AJS.I18n.getText('bitbucket.date.format.edited.x.days.ago', param);
        },
        oneWeekAgo: function oneWeekAgo() {
            return AJS.I18n.getText('bitbucket.date.format.edited.one.week.ago');
        }
    };

    exports.commentEditedAge = commentEditedAgeMapping;
});