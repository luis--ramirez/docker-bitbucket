define("bitbucket/internal/bbui/filter-bar/components/async-select","module exports react classnames jquery lodash react-dom internal/util/navigator ../../aui-react/spinner ./filter".split(" "),function(p,f,a,k,q,r,t,u,v,w){Object.defineProperty(f,"__esModule",{value:!0});var d=babelHelpers.interopRequireDefault(a),n=babelHelpers.interopRequireDefault(k),l=babelHelpers.interopRequireDefault(q),x=babelHelpers.interopRequireDefault(r),h=babelHelpers.interopRequireDefault(t),y=babelHelpers.interopRequireDefault(u),
m=babelHelpers.interopRequireDefault(v);k=function(f){function e(){var b;babelHelpers.classCallCheck(this,e);for(var c=arguments.length,a=Array(c),g=0;g<c;g++)a[g]=arguments[g];c=babelHelpers.possibleConstructorReturn(this,(b=Object.getPrototypeOf(e)).call.apply(b,[this].concat(a)));c.state={pendingItems:[],pendingQuery:null,term:"",searchBoxSpinnerContainer:document.createElement("div"),moreResultsEl:null};return c}babelHelpers.inherits(e,f);babelHelpers.createClass(e,null,[{key:"propTypes",get:function(){return{id:a.PropTypes.string.isRequired,
label:a.PropTypes.string.isRequired,loading:a.PropTypes.bool,menu:a.PropTypes.any,onChange:a.PropTypes.func,onMoreItemsRequested:a.PropTypes.func.isRequired,onResetRequested:a.PropTypes.func.isRequired,onTermChanged:a.PropTypes.func.isRequired,searchPlaceholder:a.PropTypes.string,value:a.PropTypes.string}}}]);babelHelpers.createClass(e,[{key:"componentDidMount",value:function(){var b=this,c={allowClear:!0,containerCssClass:(0,n.default)("filter-bar-async",this.props.menu.containerCssClass),dropdownCssClass:(0,
n.default)("filter-bar-async","filter-bar-dropdown-"+this.props.id,this.props.menu.dropdownCssClass),query:function(a){if(!b.state.pendingQuery||a.page!==b.state.pendingQuery.page||a.term!==b.state.pendingQuery.term){if(1>=a.page||b.state.pendingQuery)b.props.onResetRequested();if(b.state.term!==a.term)b.props.onTermChanged(a.term);b.setState({pendingQuery:a,term:a.term,moreResultsEl:document.getElementsByClassName("select2-more-results")[0]},function(){b.props.onMoreItemsRequested(function(c){b.state.pendingQuery===
a&&b.setState({pendingItems:b.state.pendingItems.concat(c)})})})}},formatLoadMore:function(){return" "},ajax:void 0},a=this.get$Input();a.auiSelect2(x.default.extend({minimumInputLength:0,minimumResultsForSearch:0,dropdownAutoWidth:!0,formatSearching:function(){return AJS.I18n.getText("bitbucket.component.filter.bar.searching")},formatNoMatches:function(){return AJS.I18n.getText("bitbucket.component.filter.bar.nomatches")}},this.props.menu,c));a.on("change",function(){return b.props.onChange()});
a.on("select2-opening",function(b){a.select2("val")&&(b.preventDefault(),a.select2("val","",!0))});if(this.props.searchPlaceholder&&!y.default.isIE())a.one("select2-open",function(){(0,l.default)(".filter-bar-dropdown-"+b.props.id+" .select2-search \x3e input").attr("placeholder",b.props.searchPlaceholder).after(b.state.searchBoxSpinnerContainer);b.props.loading&&h.default.render(d.default.createElement(m.default,null),b.state.searchBoxSpinnerContainer)})}},{key:"shouldComponentUpdate",value:function(a,
c){var e=this;a.loading&&c.pendingQuery?(1>=c.pendingQuery.page&&c.searchBoxSpinnerContainer.parentNode&&h.default.render(d.default.createElement(m.default,null),c.searchBoxSpinnerContainer),c.moreResultsEl&&h.default.render(d.default.createElement(m.default,null),c.moreResultsEl)):!a.loading&&this.state.pendingQuery&&c.pendingQuery&&function(){c.moreResultsEl&&h.default.unmountComponentAtNode(c.moreResultsEl);c.searchBoxSpinnerContainer.children.length&&h.default.unmountComponentAtNode(c.searchBoxSpinnerContainer);
var g=c.pendingQuery,d=c.pendingItems,f=!a.allFetched;e.setState({pendingItems:[],pendingQuery:null},function(){g.callback({context:g.context,results:d,more:f})})}();return!1}},{key:"get$Input",value:function(){return(0,l.default)(h.default.findDOMNode(this)).children("input")}},{key:"render",value:function(){return d.default.createElement("li",null,d.default.createElement("label",{htmlFor:this.props.id,className:"assistive"},this.props.label),d.default.createElement("input",{type:"hidden",id:this.props.id,
value:this.props.value||""}))}},{key:"value",value:function(){return this.props.value}},{key:"domValue",value:function(){return this.get$Input().val()}},{key:"reset",value:function(){this.get$Input().select2("val",!1);return l.default.Deferred().resolve()}}]);return e}(babelHelpers.interopRequireDefault(w).default);f.default=k;p.exports=f["default"]});