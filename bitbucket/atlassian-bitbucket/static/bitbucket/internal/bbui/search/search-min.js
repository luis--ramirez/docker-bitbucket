define("bitbucket/internal/bbui/search/search","module exports jquery lodash bitbucket/internal/impl/urls ../history/history ./internal/analytics ./internal/search".split(" "),function(l,e,b,m,n,p,q,r){function g(c){var a=h.default.search(c);f.default.pushState({query:c},null,a)}Object.defineProperty(e,"__esModule",{value:!0});var k=babelHelpers.interopRequireDefault(b),t=babelHelpers.interopRequireDefault(m),h=babelHelpers.interopRequireDefault(n),f=babelHelpers.interopRequireDefault(p),u=babelHelpers.interopRequireDefault(q),
v=/(project:\S*)|(repo:\S*)/g;b=function(){function c(a,w){var d=this;babelHelpers.classCallCheck(this,c);var b=(0,k.default)(a);this.options=t.default.assign({},c.defaultOptions,w);b.html(bitbucket.internal.component.search.emptyState({searchUrl:h.default.search(),query:this.options.query}));f.default.initialState({query:this.options.query});f.default.on("popstate",function(a){return d._onPopState(a)});this.$searchForm=b.find(".search-form");this.$searchResults=b.find(".search-results");this.$query=
this.$searchForm.find("input[name\x3dq]");this.$searchForm.submit(function(a){return d._onSearchSubmit(a)});this.$searchQueryAfter=this.$searchForm.find(".search-query-after");this.options.query&&""!==this.options.query.trim()&&this._search(this.options.query);b.find(".search-results").on("click",".code-search-everwhere-link",function(){var a=d.$query.val(),a=a.replace(v,""),a=a.trim();d._updateQuery(a);g(a);u.default.searchEverywhereClicked()})}babelHelpers.createClass(c,[{key:"_onSearchSubmit",
value:function(a){a=(0,k.default)(a.target).find("input.search-query").val().trim();this.$searchQueryAfter.empty();if(!a)return!1;this._search(a);g(a);return!1}},{key:"_onPopState",value:function(a){a=a.state;this._updateQuery(a&&a.query||"")}},{key:"_updateQuery",value:function(a){this.$query.val(a);this._search(a)}},{key:"_search",value:function(a){var b=this;this._searchResults&&this._searchResults.destroy();return(0,r.createSearch)(this.$searchResults,a,this.options.limits).then(function(a){b._searchResults=
a;b.$searchQueryAfter.empty();a.options.querySubstituted&&b.$searchQueryAfter.html(bitbucket.internal.component.search.querySubstituted());return a})}}]);return c}();e.default=b;b.defaultOptions={limits:{primary:10,secondary:5}};l.exports=e["default"]});