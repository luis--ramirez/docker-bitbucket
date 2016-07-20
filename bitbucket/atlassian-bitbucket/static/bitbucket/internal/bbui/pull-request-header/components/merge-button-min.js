define("bitbucket/internal/bbui/pull-request-header/components/merge-button","module exports react classnames jquery react-dom ../../aui-react/spinner".split(" "),function(l,d,c,f,m,g,n){Object.defineProperty(d,"__esModule",{value:!0});var h=babelHelpers.interopRequireDefault(c),p=babelHelpers.interopRequireDefault(f),k=babelHelpers.interopRequireDefault(m),q=babelHelpers.interopRequireDefault(n);f=function(d){function e(){babelHelpers.classCallCheck(this,e);return babelHelpers.possibleConstructorReturn(this,
Object.getPrototypeOf(e).apply(this,arguments))}babelHelpers.inherits(e,d);babelHelpers.createClass(e,[{key:"componentDidMount",value:function(){var b=(0,g.findDOMNode)(this);(0,k.default)(b).tooltip({gravity:"ne",live:!0})}},{key:"componentWillUpdate",value:function(b){var a=(0,g.findDOMNode)(this);b.mergeable.isChecking?(b=a.getBoundingClientRect(),a.style.width=b.right-b.left+"px"):a.style.width="";a.getAttribute("title")||(a.setAttribute("title",a.getAttribute("original-title")||""),a.removeAttribute("original-title"))}},
{key:"componentDidUpdate",value:function(){var b=(0,g.findDOMNode)(this),a=this.props.tooltipVisibility?"enable":"disable";(0,k.default)(b).tooltip(a)}},{key:"onClick",value:function(){if(this.props.mergeable.canMerge)this.props.onMergeClick();else this.props.onMergeWarningClick()}},{key:"mergeIssueReason",value:function(){var b="";if(!this.props.mergeable.canMerge)var a=this.props,b=a.conflicted,a=a.vetoes,a=void 0===a?[]:a,b=!b||a&&0!==a.length?a&&1===a.length&&!b?a[0].detailedMessage:AJS.I18n.getText("bitbucket.component.pull.request.merge.issue.tooltip"):
AJS.I18n.getText("bitbucket.component.pull.request.merge.conflict.tooltip");return b}},{key:"render",value:function(){var b=this,a=this.props.mergeable,c=!a.isChecking&&a.canMerge,d=(0,p.default)("aui-button","merge-button");return h.default.createElement("button",babelHelpers.extends({onClick:function(){return b.onClick()},className:d,"aria-disabled":!c,title:this.mergeIssueReason(a.canMerge)},this.props.extraButtonProps),a.isChecking?h.default.createElement(q.default,null):AJS.I18n.getText("bitbucket.component.pull.request.toolbar.merge"))}}],
[{key:"propTypes",get:function(){return{conflicted:c.PropTypes.bool,mergeable:c.PropTypes.shape({isChecking:c.PropTypes.bool,canMerge:c.PropTypes.bool}),onMergeClick:c.PropTypes.func.isRequired,onMergeWarningClick:c.PropTypes.func.isRequired,extraButtonProps:c.PropTypes.object,vetoes:c.PropTypes.arrayOf(c.PropTypes.shape({detailedMessage:c.PropTypes.string.isRequired})),tooltipVisibility:c.PropTypes.bool}}},{key:"defaultProps",get:function(){return{conflicted:!1,mergeable:{isChecking:!1,canMerge:!0},
extraButtonProps:{}}}}]);return e}(c.Component);d.default=f;l.exports=d["default"]});