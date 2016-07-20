define("bitbucket/internal/bbui/paged-table/legacy","module exports aui jquery lodash ../javascript-errors/javascript-errors ../paged-scrollable/paged-scrollable".split(" "),function(l,f,b,m,n,p,q){Object.defineProperty(f,"__esModule",{value:!0});var r=babelHelpers.interopRequireDefault(b),e=babelHelpers.interopRequireDefault(m),g=babelHelpers.interopRequireDefault(n),k=babelHelpers.interopRequireDefault(p),h=babelHelpers.interopRequireDefault(q);b=function(a){function b(){var a=0>=arguments.length||
void 0===arguments[0]?{}:arguments[0];babelHelpers.classCallCheck(this,b);var c=babelHelpers.possibleConstructorReturn(this,Object.getPrototypeOf(b).call(this,a));c.$table=(0,e.default)(c.options.tableEl);c.options.filterable&&function(){var a=c.$table.attr("id");a||(a=g.default.uniqueId("paged-table-"),c.$table.attr("id",a));c.options.filterEl?c.$filter=(0,e.default)(c.options.filterEl):(c.$filter=(0,e.default)(bitbucket.internal.component.pagedTable.filter({forId:a,filter:c.provider.filter})),c.$filter.insertBefore(c.$table));
var b=g.default.debounce(c._onFilterChanged,c.options.filterDebounce);c.$filter.on("keyup.paged-table-filter",function(a){a.which===r.default.keyCode.ESCAPE?(0,e.default)(c).blur():b(a)}).on("paste.paged-table-filter",b)}();c.$spinner=(0,e.default)(bitbucket.internal.component.pagedTable.spinner()).insertAfter(c.$table);c.provider.on("data-requested",function(){c.$spinner.removeClass("hidden").spin(c.options.spinnerSize)});a=g.default.debounce(function(){c.$spinner.addClass("hidden").spinStop()},
0);c.provider.on("data-loaded",a);c.provider.on("data-request-failed",a);return c}babelHelpers.inherits(b,a);return b}(h.default);b.defaults={spinnerSize:"large",filterable:!1,bufferPixels:150,filterDebounce:350,rowSelector:"\x3e tbody \x3e tr",rowKeySelector:"tr",focusOptions:{focusedClass:"focused",wrapAround:!1,itemLinkSelector:".title a"}};b.prototype.init=function(){var a=this;return h.default.prototype.init.apply(this,arguments).done(function(){a.shortcutsInitialised&&a.focusInitialRow()})};
b.prototype.getFilterText=function(){return this.provider.filter.term};b.prototype._onFilterChanged=function(){var a=e.default.trim(this.$filter.val());a!==this.provider.filter.term&&(this.provider.setFilter("term",a),this.provider.reset())};b.prototype.reset=function(){h.default.prototype.reset.call(this);this.$table.addClass("no-rows")};b.prototype.update=function(a){this.reset();return this.init(a)};b.prototype.attachNewContent=function(a){a.length?(this.handleNewRows(a),this._$rows=this.$table.find(this.options.rowSelector),
this.provider.reachedEnd&&this.handleLastPage(),this.$table.removeClass("no-rows")):this.provider.reachedEnd&&(0===this._page?this.handleNoData():this.handleLastPage());this.updateTimestamp()};b.prototype.updateTimestamp=function(){this.$table.attr("data-last-updated",(new Date).getTime())};b.prototype.focusInitialRow=function(){this.$table.find(this.options.rowSelector).first().addClass(this.options.focusOptions.focusedClass)};b.prototype.initShortcuts=function(){this.shortcutsInitialised=!0;this.focusInitialRow();
return{destroy:this.resetShortcuts.bind(this)}};b.prototype._getFocusedItem=function(){return this.$table.find(this.options.rowSelector+"."+this.options.focusOptions.focusedClass)};b.prototype.openItem=function(){var a=this._getFocusedItem();a.length&&a.find(this.options.focusOptions.itemLinkSelector).get(0).click()};b.prototype._moveFocus=function(a){var b=this._getFocusedItem(),d=b[a](this.options.rowKeySelector);this.options.focusOptions.wrapAround&&("next"===a&&b.is(this._$rows.last())&&(d=this._$rows.first()),
"prev"===a&&b.is(this._$rows.first())&&(d=this._$rows.last()));b.length&&d.length&&(d.addClass(this.options.focusOptions.focusedClass),b.removeClass(this.options.focusOptions.focusedClass),b=this.$scrollElement.scrollTop(),a=this.$scrollElement.scrollTop()+this.$scrollElement.height(),b=d.offset().top<b,a=d.offset().top+d.height()>a,(b||a)&&d.get(0).scrollIntoView(a))};b.prototype.moveNext=function(){this._moveFocus("next")};b.prototype.movePrevious=function(){this._moveFocus("prev")};b.prototype.resetShortcuts=
function(){this.shortcutsInitialised=!1};b.prototype._new$Message=function(a){"function"===typeof a&&(a=a.call(this));if(a)return bitbucket.internal.component.pagedTable.message({content:a,extraClasses:this.options.tableMessageClass})};b.prototype.handleLastPage=function(){this.$table.after(this._new$Message(this.options.allFetchedMessageHtml))};b.prototype.handleNoData=function(){this.$table.addClass("no-rows").after(this._new$Message(this.options.getNoneFoundMessageHtml()))};b.prototype.handleErrors=
function(a){throw new k.default.NotImplementedError;};b.prototype.handleNewRows=function(a){throw new k.default.NotImplementedError;};b.prototype.clear=function(){this.$table.children("tbody").empty();this.$table.addClass("no-rows").nextAll(".paged-table-message").remove()};f.default=b;l.exports=f["default"]});