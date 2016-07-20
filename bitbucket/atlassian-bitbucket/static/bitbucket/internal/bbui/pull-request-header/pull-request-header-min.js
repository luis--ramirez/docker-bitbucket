define("bitbucket/internal/bbui/pull-request-header/pull-request-header","module exports react classnames lodash ../aui-react/avatar ../branch-from-to/branch-from-to ../models/models ../reviewer-avatar-list/reviewer-avatar-list ../reviewer-status/reviewer-status ./components/merge ./components/pull-request-more ./components/reopen-button".split(" "),function(k,e,a,f,l,g,m,d,n,p,q,r,t){Object.defineProperty(e,"__esModule",{value:!0});var b=babelHelpers.interopRequireDefault(a),h=babelHelpers.interopRequireDefault(f);
f=babelHelpers.interopRequireDefault(l);var u=babelHelpers.interopRequireDefault(g),v=babelHelpers.interopRequireDefault(m),w=babelHelpers.interopRequireDefault(n),x=babelHelpers.interopRequireDefault(p),y=babelHelpers.interopRequireDefault(q),z=babelHelpers.interopRequireDefault(r),A=babelHelpers.interopRequireDefault(t);g={conditions:a.PropTypes.objectOf(a.PropTypes.bool),mergeHelp:a.PropTypes.object,currentUserAsReviewer:a.PropTypes.object,currentUserIsWatching:a.PropTypes.bool,currentUserStatus:a.PropTypes.oneOf(f.default.values(d.ApprovalState)),
onMergeClick:a.PropTypes.func.isRequired,onReOpenClick:a.PropTypes.func.isRequired,onMergeHelpDialogClose:a.PropTypes.func,onMoreAction:a.PropTypes.func.isRequired,onSelfClick:a.PropTypes.func.isRequired,onStatusClick:a.PropTypes.func.isRequired,pullRequest:a.PropTypes.object.isRequired,permissionToReview:a.PropTypes.bool.isRequired,showMergeHelpDialog:a.PropTypes.bool};a=function(a){function c(){babelHelpers.classCallCheck(this,c);return babelHelpers.possibleConstructorReturn(this,Object.getPrototypeOf(c).apply(this,
arguments))}babelHelpers.inherits(c,a);babelHelpers.createClass(c,[{key:"pullRequestStateReadable",value:function(a){var b,c=(b={},babelHelpers.defineProperty(b,d.PullRequestState.OPEN,AJS.I18n.getText("bitbucket.component.pull.request.list.state.open")),babelHelpers.defineProperty(b,d.PullRequestState.DECLINED,AJS.I18n.getText("bitbucket.component.pull.request.list.state.declined")),babelHelpers.defineProperty(b,d.PullRequestState.MERGED,AJS.I18n.getText("bitbucket.component.pull.request.list.state.merged")),
b);return c.hasOwnProperty(a)?c[a]:""}},{key:"render",value:function(){var a=this.props.pullRequest,c=a.state===d.PullRequestState.OPEN,e=void 0,f=void 0;a.state===d.PullRequestState.DECLINED&&this.props.conditions.canEdit&&(e=b.default.createElement(A.default,{onReOpenClick:this.props.onReOpenClick}));c&&(f=b.default.createElement(x.default,{currentUserAsReviewer:this.props.currentUserAsReviewer,onStatusClick:this.props.onStatusClick,status:this.props.currentUserStatus}));return b.default.createElement("div",
{className:"pull-request-header"},b.default.createElement("div",{className:"flexible"},b.default.createElement("div",{className:"pull-request-metadata"},b.default.createElement(u.default,{className:"author",person:a.author,withName:!0,withLink:!0}),b.default.createElement(v.default,{fromRef:a.from_ref,toRef:a.to_ref}),b.default.createElement("div",{className:"divider"}),b.default.createElement("div",{className:(0,h.default)("status","aui-lozenge",{"aui-lozenge-complete":a.state===d.PullRequestState.OPEN,
"aui-lozenge-error":a.state===d.PullRequestState.DECLINED,"aui-lozenge-success":a.state===d.PullRequestState.MERGED})},this.pullRequestStateReadable(a.state))),b.default.createElement("div",{className:(0,h.default)("pull-request-actions",{pullRequestIsOpen:c})},b.default.createElement(w.default,{reviewers:a.reviewers,menuId:"overflow-reviewers",triggerClass:"overflow-reviewers-trigger",maxOpen:4,avatarSize:"small",reverse:!0,onSelfClick:this.props.onSelfClick,currentUserAsReviewer:this.props.currentUserAsReviewer,
isWatching:this.props.currentUserIsWatching,permissionToReview:this.props.permissionToReview,pullRequestIsOpen:c}),f,b.default.createElement(y.default,{conditions:this.props.conditions,mergeHelp:this.props.mergeHelp,onMergeClick:this.props.onMergeClick,onMergeHelpDialogClose:this.props.onMergeHelpDialogClose,pullRequest:a,showMergeHelpDialog:this.props.showMergeHelpDialog}),e,b.default.createElement(z.default,{onMoreAction:this.props.onMoreAction,isWatching:this.props.currentUserIsWatching,conditions:this.props.conditions,
pullRequest:a}))),b.default.createElement("h2",null,a.title))}}]);return c}(a.Component);a.propTypes=g;e.default=a;k.exports=e["default"]});