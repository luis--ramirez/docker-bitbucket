define("bitbucket/internal/bbui/pull-request-table/components/author-avatar",["module","exports","react","../../aui-react/avatar"],function(f,a,c,d){Object.defineProperty(a,"__esModule",{value:!0});var e=babelHelpers.interopRequireDefault(c),g=babelHelpers.interopRequireDefault(d);d=function(a){function b(){babelHelpers.classCallCheck(this,b);return babelHelpers.possibleConstructorReturn(this,Object.getPrototypeOf(b).apply(this,arguments))}babelHelpers.inherits(b,a);babelHelpers.createClass(b,[{key:"shouldComponentUpdate",
value:function(a){return this.props.author!==a.author}},{key:"render",value:function(){return e.default.createElement("td",{className:"author-avatar"},e.default.createElement(g.default,{person:this.props.author,size:"medium"}))}}],[{key:"propTypes",get:function(){return{author:c.PropTypes.object.isRequired}}}]);return b}(c.Component);a.default=d;f.exports=a["default"]});