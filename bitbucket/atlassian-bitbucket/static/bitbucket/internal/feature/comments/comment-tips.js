'use strict';

define('bitbucket/internal/feature/comments/comment-tips', ['aui', 'bitbucket/internal/util/navigator'], function (AJS, navigatorUtil) {

    'use strict';

    return {
        tips: [navigatorUtil.isMac() ? AJS.I18n.getText('bitbucket.web.comment.tip.cmdEnter') : AJS.I18n.getText('bitbucket.web.comment.tip.ctrlEnter'), AJS.I18n.getText('bitbucket.web.comment.tip.mention'), AJS.I18n.getText('bitbucket.web.comment.tip.markdown', "<a href=bitbucket_help_url('bitbucket.help.markup.syntax.guide') target=\"_blank\">", '</a>')]
    };
});