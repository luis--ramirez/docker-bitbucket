define("bitbucket/internal/bbui/data-provider/pull-request-list",["module","exports","bitbucket/internal/impl/data-provider/paged","../json-validation/json-validation","../models/models"],function(h,a,b,c,k){Object.defineProperty(a,"__esModule",{value:!0});b=babelHelpers.interopRequireDefault(b);var l=babelHelpers.interopRequireDefault(c),f=babelHelpers.interopRequireDefault(k);c=function(a){function d(){var a,b=0>=arguments.length||void 0===arguments[0]?{}:arguments[0];babelHelpers.classCallCheck(this,
d);b.jsonDescriptor=[f.default.pull_request];b.filterDescriptor={author_id:"string?",query:"string?",target_ref_id:"string?",reviewer_id:"string?",state:l.default.asEnum("PullRequestState",f.default.PullRequestState)};for(var c=arguments.length,g=Array(1<c?c-1:0),e=1;e<c;e++)g[e-1]=arguments[e];return babelHelpers.possibleConstructorReturn(this,(a=Object.getPrototypeOf(d)).call.apply(a,[this,b].concat(g)))}babelHelpers.inherits(d,a);return d}(b.default);a.default=c;h.exports=a["default"]});