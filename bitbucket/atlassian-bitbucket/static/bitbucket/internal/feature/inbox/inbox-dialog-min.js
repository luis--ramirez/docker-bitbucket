define("bitbucket/internal/feature/inbox-dialog","aui jquery lodash react react-dom bitbucket/util/navbuilder bitbucket/util/server bitbucket/util/state bitbucket/internal/bbui/inbox/inbox bitbucket/internal/bbui/models/models bitbucket/internal/model-transformer exports".split(" "),function(g,h,e,f,k,q,r,l,t,m,n,u){var p,v=f.createClass({displayName:"InboxView",componentWillMount:function(){this.setState({created:{pullRequests:[],allFetched:!1,loading:!1,onMoreItemsRequested:this.onMorePrsRequested.bind(this,
"created")},reviewing:{pullRequests:[],allFetched:!1,loading:!1,onMoreItemsRequested:this.onMorePrsRequested.bind(this,"reviewing")},currentUser:n.user(l.getCurrentUser()),nextPageStart:0})},onMorePrsRequested:function(a){if(!this.state[a].loading){this.setState(e.extend(this.state[a],{loading:!0}));var b=this;r.rest({url:b.getInboxResourceUrlBuilder(this.mapTablePropToRole[a]).build(),type:"GET",statusCode:{0:b.handleError,401:b.handleError,500:b.handleError,502:b.handleError}}).done(function(d){var c=
d.values.map(n.pullRequest);b.setState(e.extend(b.state[a],{pullRequests:b.state[a].pullRequests.concat(c),loading:!1,allFetched:d.isLastPage,nextPageStart:e.get(d,"nextPageStart",0)}))})}},getInboxResourceUrlBuilder:function(a){return q.rest().addPathComponents("inbox","pull-requests").withParams({role:a,start:this.state.nextPageStart,limit:10,avatarSize:bitbucket.internal.widget.avatarSizeInPx({size:"medium"}),withAttributes:!0,state:"OPEN",order:"oldest"})},handleError:function(a,b,d,c){a={};c&&
(a=c.errors?c.errors[0]:c);k.unmountComponentAtNode(p);h("#inbox .aui-inline-dialog-contents").html(h(bitbucket.internal.inbox.error({title:g.I18n.getText("bitbucket.web.header.inbox.error.title"),text:a.message||g.I18n.getText("bitbucket.web.header.inbox.error.unknown")})));return!1},mapTablePropToRole:{created:m.ParticipantRole.AUTHOR,reviewing:m.ParticipantRole.REVIEWER},render:function(){return f.createElement(t,{created:this.state.created,reviewing:this.state.reviewing,onMoreItemsRequested:this.onMorePrsRequested,
currentUser:this.state.currentUser},null)}});u.onReady=function(a){if((p=a)&&l.getCurrentUser()){var b=f.createElement(v,null);k.render(b,a)}}});