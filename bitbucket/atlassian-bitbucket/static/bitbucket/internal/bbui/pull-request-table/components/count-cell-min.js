define("bitbucket/internal/bbui/pull-request-table/components/count-cell",["module","exports","react","classnames"],function(f,e,b,c){function g(a){return 99<a?"99+":a+""}Object.defineProperty(e,"__esModule",{value:!0});var d=babelHelpers.interopRequireDefault(b),h=babelHelpers.interopRequireDefault(c);b={count:b.PropTypes.number.isRequired,icon:b.PropTypes.node.isRequired,tooltip:b.PropTypes.string.isRequired,className:b.PropTypes.string};c=function(a){return d.default.createElement("td",{className:(0,
h.default)("count-column-value",a.className)},0<a.count&&d.default.createElement("span",{title:a.tooltip},a.icon,d.default.createElement("span",null," "),d.default.createElement("span",{className:"count"},g(a.count))))};c.Header=function(){return d.default.createElement("th",{className:"count-column"})};c.propTypes=b;e.default=c;f.exports=e["default"]});