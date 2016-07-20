'use strict';

define('bitbucket/internal/feature/comments/comment-context', ['backbone', 'jquery', 'lodash', 'bitbucket/internal/feature/comments/comment-container', 'bitbucket/internal/util/client-storage', 'bitbucket/internal/util/events'], function (Backbone, $, _, CommentContainer, clientStorage, events) {

    'use strict';

    return Backbone.View.extend({
        initialize: function initialize() {
            this._containers = {};
            this.checkForNewContainers();

            var self = this;

            events.on('bitbucket.internal.feature.comments.commentAdded', this._commentAddedHandler = function (commentJson, $comment) {
                if (self.$el.find($comment).length && self.$el.find('.comment').length === 1) {
                    events.trigger('bitbucket.internal.feature.comments.firstCommentAdded', null, self.$el);
                }
            });

            // Support migration from single draft
            var savedDrafts = this.getDrafts() || [];
            this.unrestoredDrafts = this.drafts = _.isArray(savedDrafts) ? savedDrafts : [savedDrafts];
            this.restoreDrafts();
        },
        includesContainer: function includesContainer(name) {
            return _.has(this._containers, name);
        },
        registerContainer: function registerContainer(containerEl, anchor) {
            var containerId = anchor.getId();
            if (!this.includesContainer(containerId)) {
                this._registerContainer(containerId, containerEl, anchor);
            }
        },
        _registerContainer: function _registerContainer(name, element, anchor) {
            this._containers[name] = new CommentContainer({
                name: name,
                context: this,
                el: element,
                anchor: anchor
            });
            return this._containers[name];
        },
        checkForNewContainers: function checkForNewContainers() {
            var self = this;
            _.forEach(this.findContainerElements(), function (commentContainer) {
                self.registerContainer(commentContainer, self.getAnchor(commentContainer));
            });
        },
        findContainerElements: function findContainerElements() {
            return this.$('.comment-container');
        },
        getAnchor: function getAnchor() /*$commentContainerElement*/{
            return this.options.anchor;
        },
        /**
         * Remove any properties from the draft that make it difficult to do an accurate "sameness" check
         * @param {Object} originalDraft
         * @returns {Object} - The modified draft
         */
        clarifyAmbiguousDraftProps: function clarifyAmbiguousDraftProps(originalDraft) {
            //Comment text is not useful in determining "sameness"
            return _.omit(originalDraft, 'text');
        },
        deleteDraftComment: function deleteDraftComment(draft, persist) {
            persist = _.isBoolean(persist) ? persist : true;

            var isSameDraft = _.isEqual.bind(_, this.clarifyAmbiguousDraftProps(draft));

            //Remove drafts which match the supplied draft (ignoring text)
            this.drafts = _.reject(this.drafts, _.compose(isSameDraft, this.clarifyAmbiguousDraftProps.bind(this)));

            if (persist) {
                this.saveDraftComments();
            }
        },
        getDrafts: function getDrafts() {
            return clientStorage.getSessionItem(this.getDraftsKey());
        },
        getDraftsKey: function getDraftsKey() {
            return clientStorage.buildKey(['draft-comment', this.options.anchor.getId()], 'user');
        },
        /**
         * @abstract
         */
        restoreDrafts: $.noop,
        saveDraftComment: function saveDraftComment(draft) {
            //Remove any old versions of this comment (don't persist yet)
            this.deleteDraftComment(draft, false);

            //Only add drafts that have content
            draft.text && this.drafts.push(draft);

            this.saveDraftComments();
        },
        saveDraftComments: function saveDraftComments() {
            clientStorage.setSessionItem(this.getDraftsKey(), this.drafts);
        },
        /**
         * Clean up the comment context
         * We pass in the isFileChangeCleanup when the opt_container was not passed in the first time
         * this way we can explicitly only trigger the lastCommentDeleted event when the comment was
         * actually deleted, rather than trigger it as part of the file change cleanup.
         *
         * @param {CommentContext} opt_container
         * @param {boolean} isFileChangeCleanup
         */
        destroy: function destroy(opt_container, isFileChangeCleanup) {
            if (opt_container) {
                opt_container.remove();
                delete this._containers[opt_container.options.name];

                if (!this.$el.has('.comment').length && !isFileChangeCleanup) {
                    events.trigger('bitbucket.internal.feature.comments.lastCommentDeleted', null, this.$el);
                }
            } else {
                isFileChangeCleanup = true;
                _.invoke(this._containers, 'destroy', isFileChangeCleanup);
                this._containers = null;

                if (this._commentAddedHandler) {
                    events.off('bitbucket.internal.feature.comments.commentAdded', this._commentAddedHandler);
                    delete this._commentAddedHandler;
                }
            }
        }
    });
});