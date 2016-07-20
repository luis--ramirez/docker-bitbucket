define("bitbucket/internal/bbui/quick-search/quick-search","module exports aui jquery lodash bitbucket/internal/impl/request bitbucket/internal/impl/search-urls bitbucket/internal/impl/urls ../search-common/search-entities ../search-common/search-request ./internal/analytics ../avatars/avatars ../bb-panel/bb-panel".split(" "),function(n,h,e,p,q,r,t,u,v,w,x){Object.defineProperty(h,"__esModule",{value:!0});var c=babelHelpers.interopRequireDefault(e),f=babelHelpers.interopRequireDefault(p),k=babelHelpers.interopRequireDefault(q),
y=babelHelpers.interopRequireDefault(r),z=babelHelpers.interopRequireDefault(t),m=babelHelpers.interopRequireDefault(u),A=babelHelpers.interopRequireDefault(v),l=babelHelpers.interopRequireDefault(x);e=function(){function e(a,b){var d=this;babelHelpers.classCallCheck(this,e);this.options=babelHelpers.extends({},e.defaultOptions,b);this.useContext=!(!this.options.project&&!this.options.repository);this.focusClass=this.options.focusClass||"focus";this.navigableClass=this.options.navigableClass||"navigable";
this._doRepoSearch=k.default.debounce(function(a){3<=a.length&&d.doRepoSearch(a)},200);var c=(0,f.default)(bitbucket.internal.component.quickSearch.searchBox({searchUrl:m.default.search()}));(0,f.default)(a).replaceWith(c);this.$input=c.find("#quick-search");var g=(0,f.default)(bitbucket.internal.component.quickSearch.searchPanel());g.appendTo((0,f.default)("body"));this.panel=g[0];this.$quickSearchBox=c.closest(".aui-quicksearch");this.$spinner=c.find(".spinner");this.$searchMainPanel=g.find(".quick-search-main");
this.$searchErrorPanel=g.find(".quick-search-error");this.$searchResults=g.find(".quick-search-results");this.$searchResults.on("mouseover","."+this.navigableClass,function(a){a=(0,f.default)(a.target).closest(".result");d._focusResult(a)});this.$searchResults.on("mouseleave","."+this.navigableClass,function(){d._blurResults()});this.$searchResults.on("click","a",function(a){a=(0,f.default)(a.currentTarget);a.hasClass("repository-link")?l.default.resultClicked({project:d.options.project,repository:d.options.repository,
clickedProjectId:a.attr("data-project-id"),clickedRepoId:a.attr("data-repo-id")}):a.hasClass("code-link")});this.$input.on("focus",function(a){return d._onFocus(a)});this.$input.on("keyup",function(a){return d._onKeyUp(a)});this.$input.on("keydown",function(a){return d._onKeyDown(a)});c.on("submit",function(a){return a.preventDefault()})}babelHelpers.createClass(e,[{key:"doCodeSearch",value:function(a){this._updateSearchTerms(a);window.location=this.$searchResults.find(".code-link").attr("href")}},
{key:"doRepoSearch",value:function(a){var b=this,c=Date.now();this._spinnerStart();this.$searchResults.removeClass("search-complete").addClass("search-inprogress");this.currentSearchRequest&&this.currentSearchRequest.abort();this.currentSearchRequest=y.default.rest({type:"POST",url:z.default.searchRestUrl(),data:(0,w.searchFor)(a,[A.default.REPOSITORIES],{primary:9}),statusCode:{"*":!1}});this.currentSearchRequest.done(function(e){b.currentSearchTerms=a;b.$searchErrorPanel.hide();b.$searchMainPanel.show();
l.default.resultsLoaded({project:b.options.project,repository:b.options.repository,time:Date.now()-c,query:a});e=bitbucket.internal.component.quickSearch.repositoryResults({repos:e.repositories.values.map(b._transformRepository),totalRepoCount:e.repositories.count});b.$searchResults.find(".repository-heading").remove();b.$searchResults.find(".repository").remove();b.$searchResults.append(e);b.$searchResults.addClass("search-complete")}).fail(function(a,c){"abort"!==c&&(b.$searchMainPanel.hide(),b.$searchErrorPanel.show())}).always(function(){b.currentSearchRequest=
null;b.$searchResults.removeClass("search-inprogress");b._spinnerStop()})}},{key:"focus",value:function(){this.$input.focus()}},{key:"_transformRepository",value:function(a){k.default.has(a,"avatarUrl")&&(a.avatar_url=a.avatarUrl);k.default.has(a,"project.avatarUrl")&&(a.project.avatar_url=a.project.avatarUrl);return a}},{key:"_setInputAttribute",value:function(a,b){this.$input.get(0).setAttribute(a,b)}},{key:"_getQuery",value:function(){return this.$input.val().trim()}},{key:"_getContext",value:function(){var a=
"";this.options.repository?a="project:"+this.options.project.key+" repo:"+this.options.repository.slug:this.options.project&&(a="project:"+this.options.project.key);return a}},{key:"_blurResults",value:function(){var a=this;this.$searchResults.find("."+this.navigableClass+"."+this.focusClass).removeClass(this.focusClass);setTimeout(function(){return a._setInputAttribute("aria-activedescendant",null)},50)}},{key:"_focusResult",value:function(a){var b=this;this._blurResults();a.addClass(this.focusClass);
setTimeout(function(){return b._setInputAttribute("aria-activedescendant",a.find('[role\x3d"option"]').attr("id"))},50)}},{key:"_handleUpAndDownKeys",value:function(a){a.preventDefault();var b=this.$searchResults.find("."+this.navigableClass+"."+this.focusClass),d=void 0;0===b.length?a.keyCode===c.default.keyCode.DOWN?d=this.$searchResults.find("."+this.navigableClass+":first"):a.keyCode===c.default.keyCode.UP&&(d=this.$searchResults.find("."+this.navigableClass+":last")):a.keyCode===c.default.keyCode.DOWN?
d=b.nextAll("."+this.navigableClass).first():a.keyCode===c.default.keyCode.UP&&(d=b.prevAll("."+this.navigableClass).first());0!==d.length&&this._focusResult(d)}},{key:"_onFocus",value:function(){var a=this._getQuery();this._updatePanel(3<=a.length);l.default.focused({project:this.options.project,repository:this.options.repository})}},{key:"_onKeyDown",value:function(a){if(a.keyCode===c.default.keyCode.DOWN||a.keyCode===c.default.keyCode.UP)a.preventDefault(),this._handleUpAndDownKeys(a)}},{key:"_onKeyUp",
value:function(a){var b=this._getQuery();this._updatePanel(a.keyCode!==c.default.keyCode.ESCAPE&&3<=b.length);if(a.keyCode===c.default.keyCode.ENTER){var d=this.$searchResults.find(".repository."+this.focusClass);0<d.length?d.find("a")[0].click():1<=b.length&&this.doCodeSearch(b);a.preventDefault()}else a.keyCode!==c.default.keyCode.LEFT&&a.keyCode!==c.default.keyCode.UP&&a.keyCode!==c.default.keyCode.RIGHT&&a.keyCode!==c.default.keyCode.DOWN&&a.keyCode!==c.default.keyCode.ESCAPE&&(this._updateSearchTerms(b),
this.currentSearchRequest&&(this.currentSearchRequest.abort(),this.currentSearchRequest=null),this._doRepoSearch(b))}},{key:"_spinnerStart",value:function(){this.$quickSearchBox.addClass("loading");this.$spinner.spin();this._setInputAttribute("aria-busy",!0)}},{key:"_spinnerStop",value:function(){this.$spinner.spinStop();this.$quickSearchBox.removeClass("loading");this._setInputAttribute("aria-busy",!1)}},{key:"_updateSearchTerms",value:function(a){var b=this.useContext?this._getContext()+" "+a:a;
(0,f.default)("#code-result").toggleClass("hidden",3>a.length).attr("title",c.default.I18n.getText("bitbucket.component.quick-search.terms",a)).attr("href",m.default.search(b)).find(".terms").text(a)}},{key:"_updatePanel",value:function(a){if(a){var b=this._getQuery();this.currentSearchTerms!==b&&(this.$searchResults.empty().html(bitbucket.internal.component.quickSearch.codeResult()),this._updateSearchTerms(b));0===this.$searchResults.find("."+this.focusClass).length&&this._focusResult(this.$searchResults.find("."+
this.navigableClass).first())}else this._blurResults();this.panel.open=a;this._setInputAttribute("aria-expanded",a)}}]);return e}();h.default=e;e.defaultOptions={project:null,repository:null};n.exports=h["default"]});