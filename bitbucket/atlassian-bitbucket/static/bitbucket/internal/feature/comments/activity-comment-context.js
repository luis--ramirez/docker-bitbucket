'use strict';

define('bitbucket/internal/feature/comments/activity-comment-context', ['lodash', 'bitbucket/internal/feature/comments/activity-comment-container', 'bitbucket/internal/feature/comments/comment-context', 'bitbucket/internal/util/events'], function (_, ActivityCommentContainer, CommentContext, events) {

    'use strict';

    return CommentContext.extend({
        findContainerElements: function findContainerElements() {
            return [this.el];
        },
        _registerContainer: function _registerContainer(name, element, anchor) {
            this._containers[name] = new ActivityCommentContainer({
                name: name,
                context: this,
                el: element,
                anchor: anchor
            });
            return this._containers[name];
        },
        /**
         * Get the ActivityCommentContainer for this context
         * @returns {ActivityCommentContainer}
         */
        getActivityCommentContainer: function getActivityCommentContainer() {
            return this._containers[this.getAnchor().getId()];
        },
        /**
         * Try and restore all the unrestored drafts, if any can't be restored, try again the next time more activities are loaded
         */
        restoreDrafts: function restoreDrafts() {
            if (this.unrestoredDrafts.length) {
                var activityCommentContainer = this.getActivityCommentContainer();

                //Remove any restored drafts from the list
                this.unrestoredDrafts = _.reject(this.unrestoredDrafts, activityCommentContainer.restoreDraftComment.bind(activityCommentContainer));

                if (this.unrestoredDrafts.length) {
                    //There are still unrestored drafts, they might be attached to the next page of activity
                    events.once('bitbucket.internal.feature.pullRequestActivity.dataLoaded', this.restoreDrafts.bind(this));
                }
            }
        }
    });
});