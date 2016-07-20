define("bitbucket/internal/page/pull-request-list/view","jquery lodash react bitbucket/internal/bbui/models/models bitbucket/internal/bbui/pull-request-list/pull-request-list bitbucket/internal/feature/pull-request/list/analytics bitbucket/internal/impl/data-provider/participants bitbucket/internal/impl/data-provider/pull-request-list bitbucket/internal/impl/data-provider/ref bitbucket/internal/util/events bitbucket/internal/util/object bitbucket/internal/util/shortcuts".split(" "),function(d,b,h,
p,q,r,f,t,u,v,w,n){function k(a){f.apply(this,arguments);this._preloadItems=a.preload||[];this._preloaded=this._initialPreloadedState=0===this._preloadItems.length;this._equalityCheck=a.equals||function(a,b){return a.id===b.id}}w.inherits(k,f);k.prototype.reset=function(){this._preloaded=this._initialPreloadedState;return f.prototype.reset.call(this)};k.prototype._fetchNext=function(a){if(!this._preloaded)if(this.filter.term)this._preloaded=!0;else return a=d.Deferred(),a.resolve(this._preloadItems),
a.abort=d.noop,a;return f.prototype._fetchNext.call(this,a===this._preloadItems?null:a)};k.prototype._transform=function(a){if(!this._preloaded)return this._preloaded=!0,this._preloadItems;var c=this._equalityCheck,b=this._preloadItems;a=f.prototype._transform.call(this,a);return this.filter.term?a:a.filter(function(a){return!b.some(function(b){return c(b,a)})})};return h.createClass({displayName:"PullRequestListView",getInitialState:function(){return{page:0,pullRequests:[]}},componentWillMount:function(a){function c(a,
c){function f(a){var d=g.state.filter||{},e={};e[c]=b.extend(d[c]||{},a);return{filter:b.extend(d,e)}}function e(){return{loading:a.isFetching,allFetched:a.reachedEnd}}function d(){g.setState(f(e()))}return b.extend({onMoreItemsRequested:function(b){a.isFetching||(a.fetchNext().then(b).then(d),d())},onTermChanged:function(b){a.setFilter("term",b||"");d()},onResetRequested:function(){a.reset();d()}},e())}function f(a){return function(){g.setState(function(b){return{focusedIndex:Math.max(Math.min(b.focusedIndex+
a,b.pullRequests.length-1),0)}},function(){document.querySelector(".pull-request-row.focused a.pull-request-title").focus()})}}var g=this;a=this.props.currentUser;var m=this.props.repository,d=new k({preload:a?[a]:null,equals:function(a,b){return a.name===b.name},repository:m,filter:{role:p.ParticipantRole.AUTHOR}}),h=new u({filter:{repository:m,type:"branch",term:""}}),l=b.extend({state:{value:this.props.initialFilter.state},reviewer_self:{value:this.props.initialFilter.reviewer_self||!1}},{author:b.extend({},
c(d,"author"),{value:this.props.selectedAuthor&&this.props.selectedAuthor.name}),target_ref:b.extend({},c(h,"target_ref"),{value:this.props.selectedTargetBranch&&this.props.selectedTargetBranch.id})}),e=new t({repository:m.id,filter:{state:l.state.value||p.PullRequestState.OPEN,author_id:l.author.value||null,target_ref_id:l.target_ref.value||null,reviewer_id:l.reviewer_self.value&&a?a.name:null}});this.setState({focusedIndex:0,filter:l,currentUser:a,repository:m,authorProvider:d,branchProvider:h,
prProvider:e,onMorePrsRequested:function(){e.isFetching||(g.setState({loading:!0}),e.fetchNext().then(function(a){var b=g.state.page+1;g.setState({pullRequests:g.state.pullRequests.concat(a),loading:e.isFetching,allFetched:e.reachedEnd,page:b});v.trigger("bitbucket.internal.pull.request.list.updated");r.onPaginate({page:b})}))},allFetched:e.reachedEnd,loading:e.isFetching});n.bind("requestMoveToNextHandler",f(1));n.bind("requestMoveToPreviousHandler",f(-1));n.bind("requestOpenItemHandler",function(){document.querySelector(".pull-request-row.focused a.pull-request-title").click()})},
render:function(){var a=this;return h.createElement(q,{repository:this.state.repository,currentUser:this.state.currentUser,initialFilter:this.state.filter,allFetched:this.state.allFetched,focusedIndex:this.state.focusedIndex,gettingStarted:this.props.gettingStarted,loading:this.state.loading,onFilterChange:function(c){a.state.prProvider.setFilter("state",c.state);a.state.prProvider.setFilter("author_id",c.author_id);a.state.prProvider.setFilter("target_ref_id",c.target_ref_id);a.state.prProvider.setFilter("reviewer_id",
c.reviewer_self&&a.state.currentUser?a.state.currentUser.name:null);a.state.prProvider.reset();var d=b.extend({},a.state.filter,{state:b.extend({},a.state.filter.state,{value:c.state}),author:b.extend({},a.state.filter.author,{value:c.author_id}),target_ref:b.extend({},a.state.filter.target_ref,{value:c.target_ref_id}),reviewer_self:b.extend({},a.state.filter.reviewer_self,{value:c.reviewer_self})});a.setState({pullRequests:[],filter:d},a.state.onMorePrsRequested);a.props.onFilterChange(c)},onMorePrsRequested:this.state.onMorePrsRequested,
pullRequests:this.state.pullRequests,selectedAuthor:this.props.selectedAuthor,selectedTargetBranch:this.props.selectedTargetBranch})}})});