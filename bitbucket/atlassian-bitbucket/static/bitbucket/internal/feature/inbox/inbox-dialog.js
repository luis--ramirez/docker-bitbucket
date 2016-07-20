'use strict';

define('bitbucket/internal/feature/inbox-dialog', ['aui', 'jquery', 'lodash', 'react', 'react-dom', 'bitbucket/util/navbuilder', 'bitbucket/util/server', 'bitbucket/util/state', 'bitbucket/internal/bbui/inbox/inbox', 'bitbucket/internal/bbui/models/models', 'bitbucket/internal/model-transformer', 'exports'], function (AJS, $, _, React, ReactDOM, nav, server, pageState, Inbox, models, transformer, exports) {
    var container;

    var InboxView = React.createClass({
        displayName: 'InboxView',

        componentWillMount: function componentWillMount() {
            this.setState({
                created: {
                    pullRequests: [],
                    allFetched: false,
                    loading: false,
                    onMoreItemsRequested: this.onMorePrsRequested.bind(this, 'created')
                },
                reviewing: {
                    pullRequests: [],
                    allFetched: false,
                    loading: false,
                    onMoreItemsRequested: this.onMorePrsRequested.bind(this, 'reviewing')
                },
                currentUser: transformer.user(pageState.getCurrentUser()),
                nextPageStart: 0
            });
        },
        onMorePrsRequested: function onMorePrsRequested(tableProp) {
            if (this.state[tableProp].loading) {
                return;
            }
            this.setState(_.extend(this.state[tableProp], {
                loading: true
            }));
            var self = this;
            server.rest({
                url: self.getInboxResourceUrlBuilder(this.mapTablePropToRole[tableProp]).build(),
                type: 'GET',
                'statusCode': {
                    0: self.handleError,
                    401: self.handleError,
                    500: self.handleError,
                    502: self.handleError
                }
            }).done(function (data) {
                var stashifiedPrs = data.values.map(transformer.pullRequest);
                self.setState(_.extend(self.state[tableProp], {
                    pullRequests: self.state[tableProp].pullRequests.concat(stashifiedPrs),
                    loading: false,
                    allFetched: data.isLastPage,
                    nextPageStart: _.get(data, 'nextPageStart', 0)
                }));
            });
        },
        getInboxResourceUrlBuilder: function getInboxResourceUrlBuilder(role) {
            return nav.rest().addPathComponents('inbox', 'pull-requests').withParams({
                role: role,
                start: this.state.nextPageStart,
                limit: 10,
                avatarSize: bitbucket.internal.widget.avatarSizeInPx({ size: 'medium' }),
                withAttributes: true,
                state: 'OPEN',
                order: 'oldest'
            });
        },
        handleError: function handleError(xhr, textStatus, errorThrown, response) {
            var responseError = {};
            if (response) {
                responseError = response.errors ? response.errors[0] : response;
            }
            ReactDOM.unmountComponentAtNode(container);
            $('#inbox .aui-inline-dialog-contents').html($(bitbucket.internal.inbox.error({
                title: AJS.I18n.getText('bitbucket.web.header.inbox.error.title'),
                text: responseError.message || AJS.I18n.getText('bitbucket.web.header.inbox.error.unknown')
            })));
            return false;
        },
        mapTablePropToRole: {
            created: models.ParticipantRole.AUTHOR,
            reviewing: models.ParticipantRole.REVIEWER
        },
        render: function render() {
            var props = {
                created: this.state.created,
                reviewing: this.state.reviewing,
                onMoreItemsRequested: this.onMorePrsRequested,
                currentUser: this.state.currentUser
            };
            return React.createElement(Inbox, props, null);
        }
    });

    exports.onReady = function (inboxContainer) {
        container = inboxContainer;
        if (inboxContainer && pageState.getCurrentUser()) {
            var inboxView = React.createElement(InboxView, null);
            ReactDOM.render(inboxView, inboxContainer);
        }
    };
});