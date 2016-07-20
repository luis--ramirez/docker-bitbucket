define("bitbucket/internal/bbui/pull-request-table/components/reviewers",["module","exports","react","lodash","../../reviewer-avatar-list/reviewer-avatar-list"],function(h,d,a,c,k){function l(a,b){return a.length!==b.length||m.default.zip(a,b).some(function(f,a){return f.name!==a.name||f.state!==a.state})}Object.defineProperty(d,"__esModule",{value:!0});var e=babelHelpers.interopRequireDefault(a),m=babelHelpers.interopRequireDefault(c),g=babelHelpers.interopRequireDefault(k);c=function(c){function b(){babelHelpers.classCallCheck(this,
b);return babelHelpers.possibleConstructorReturn(this,Object.getPrototypeOf(b).apply(this,arguments))}babelHelpers.inherits(b,c);babelHelpers.createClass(b,[{key:"shouldComponentUpdate",value:function(a){return this.props.pullRequest.id!==a.pullRequest.id||l(this.props.pullRequest.reviewers,a.pullRequest.reviewers)||this.props.pullRequest.state!==a.pullRequest.state}},{key:"render",value:function(){var a=this.props.pullRequest;return e.default.createElement("td",{className:"reviewers"},e.default.createElement(g.default,
{avatarSize:"small",currentUserAsReviewer:this.props.currentUser,currentUserAvatarSize:this.props.currentUserAvatarSize,dialogReviewersAsTooltip:this.props.dialogReviewersAsTooltip,maxOpen:3,menuId:"reviewers-"+a.id,permissionToReview:!1,pullRequestIsOpen:"OPEN"===a.state,reviewers:a.reviewers}))}}],[{key:"propTypes",get:function(){return{currentUser:a.PropTypes.object,currentUserAvatarSize:a.PropTypes.string,dialogReviewersAsTooltip:g.default.propTypes.dialogReviewersAsTooltip,pullRequest:a.PropTypes.object.isRequired}}}]);
return b}(a.Component);c.Header=function(){return e.default.createElement("th",{className:"reviewers",scope:"col"},AJS.I18n.getText("bitbucket.pull.request.table.title.reviewers"))};d.default=c;h.exports=d["default"]});