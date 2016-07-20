'use strict';

define('bitbucket/internal/feature/comments/activity-comment-container', ['jquery', 'lodash', 'bitbucket/internal/feature/comments/comment-container', 'bitbucket/internal/util/events'], function ($, _, CommentContainer, events) {

    'use strict';

    return CommentContainer.extend({
        initialize: function initialize() {
            CommentContainer.prototype.initialize.apply(this, arguments);
        },
        rootCommentListSelector: '.pull-request-activity',
        events: _.extend({}, CommentContainer.prototype.events, {
            'focus .general-comment-form textarea': 'onGeneralFormTextareaFocused'
        }),
        initDeleteButtons: function initDeleteButtons() {
            this.createDeleteDialog().attachTo('.general-comment-activity .delete', null, this.el);
        },
        insertCommentIntoList: function insertCommentIntoList($comment, $commentList, commentJSON) {
            if ($commentList.is(this.rootCommentListSelector)) {
                // TODO: we need to order it along with other activity items.
                // Luckily, until we do activity reloading, we can be assured we're only adding comments at the top.

                var $generalCommentForm = $commentList.children(':first');
                $comment.insertAfter($generalCommentForm);
            } else {
                CommentContainer.prototype.insertCommentIntoList.apply(this, arguments);
            }
        },
        closeCommentForm: function closeCommentForm($form) {
            // don't close the general comment form, just empty it out. Clean up any restored draft attributes
            $form.find('.error').remove(); // clear errors
            if ($form.is('.general-comment-form')) {
                this._unbindMarkupEditor($form);

                $form.addClass('collapsed');
                $form.find('textarea').val('').removeClass('restored').removeAttr("title").blur();

                this.deleteDraftComment(this.getDraftCommentFromForm($form));
            } else {
                CommentContainer.prototype.closeCommentForm.apply(this, arguments);
            }
        },
        getExtraCommentClasses: function getExtraCommentClasses() {
            return 'general-comment-activity';
        },
        onGeneralFormTextareaFocused: function onGeneralFormTextareaFocused(e) {
            var $form = $(e.target).closest('.general-comment-form');

            if ($form.hasClass('collapsed')) {
                this._bindMarkupEditor($form);
                $form.removeClass('collapsed');
            }
        }
    });
});