define("bitbucket/internal/widget/searchable-selector","aui jquery lodash bitbucket/internal/util/ajax bitbucket/internal/util/dom-event bitbucket/internal/util/events bitbucket/internal/util/navigator bitbucket/internal/util/promise bitbucket/internal/widget/keyboard-controller bitbucket/internal/widget/paged-scrollable".split(" "),function(g,e,f,p,q,r,m,t,n,u){function b(a,c){return this.init.apply(this,arguments)}var v=n.TabKeyboardController,w=n.ListKeyboardController,x=0;b.prototype.defaults=
{id:null,extraClasses:null,namespace:"searchable-selector",url:null,tabs:null,searchable:!0,searchPlaceholder:null,queryParamKey:"filter",queryParamsBuilder:null,pageSize:20,statusCodeHandlers:{},followLinks:!1,hideDialogOnSelect:!0,itemSelectedEvent:"bitbucket.internal.widget.searchableSelector.itemSelected",context:null,field:null,itemDataKey:"item",template:bitbucket.internal.widget.searchableSelector,resultsTemplate:bitbucket.internal.widget.searchableSelectorResults,noResultsText:null,noMoreResultsText:null,
triggerContentTemplate:bitbucket.internal.widget.searchableSelectorTriggerContent,triggerPlaceholder:null,preloadData:null,alwaysShowPreload:!1,dataTransform:null,postOptionsInit:null,clearResultsOnSearch:!0,popUpOffsetX:0,popUpOffsetY:-1,width:350};b.constructDataPageFromPreloadArray=function(a){return f.isArray(a)?{values:a,isLastPage:!1,size:a.length,start:0,limit:a.length}:null};b.prototype.tabOptionKeys="label url resultsTemplate noResultsText noMoreResultsText dataTransform queryParamKey preloadData searchPlaceholder".split(" ");
b.prototype.init=function(a,c){var d=this;this.instanceId=x++;this.$trigger=e(a);this.setOptions(c);this.scrollables=[];this.scrollableDataStores=[];this._getOptionVal("id")||(this.options.id=this._getOptionVal("namespace")+"-"+this.instanceId);this.options.tabs&&this.options.tabs.length&&(this.tabs=f.map(this.options.tabs,function(a){return e.extend(!0,{},f.pick(d.options,d.tabOptionKeys),a)}));var b=this._getOption("postOptionsInit");f.isFunction(b)&&b.call(this);var h;this.blockShortcutPropagation=
h=function(a){var c=this===document;a.keyCode===g.keyCode.ESCAPE?(a[c?"stopImmediatePropagation":"stopPropagation"](),d.dialog.hide()):c||a.stopPropagation()};var l=d._getOptionVal("externalSearchField");this.dialog=g.InlineDialog(this.$trigger,this._getOptionVal("id"),function(a,c,b){a.data("initialised")||d._initialiseDialogContent(a);b();l||f.defer(f.bind(d.setFocus,d))},{offsetX:this._getOptionVal("popUpOffsetX"),offsetY:this._getOptionVal("popUpOffsetY"),noBind:!!l,width:this._getOptionVal("width"),
hideCallback:function(){(d.$content.is(document.activeElement)||e.contains(d.$content[0],document.activeElement))&&d.$trigger.focus();e(document).add(d.dialog).off("keydown keypress",h)},initCallback:function(){e(document).add(d.dialog).on("keydown keypress",h)}});this._getOptionVal("searchable")&&l&&(this.$searchField=e(l),this._initialiseSearchOnInput());this.$trigger.find(".name").length&&(this._selectedItem=this._getItemFromTrigger());g.bind("hide.dialog",function(a,c){d.$trigger.closest(c.dialog.popup.element).length&&
d.dialog.hide()});return this};b.prototype.getSelectedItem=function(){return this._selectedItem};b.prototype.setSelectedItem=function(a){e.isPlainObject(a)&&null!=a.id&&(this._selectedItem&&this._selectedItem.id===a.id||this._itemSelected(a))};b.prototype.clearSelection=function(){this._selectedItem=null;this._getOptionVal("field")&&e(this._getOptionVal("field")).val("");this.resetTrigger()};b.prototype._getItemFromTrigger=function(){var a=this.$trigger.find(".name");return e.extend({},this._buildObjectFromElementDataAttributes(a),
{name:a.text()})};b.prototype._buildObjectFromElementDataAttributes=function(a){return e(a).data(this._getOptionVal("itemDataKey"))};b.prototype._initialiseDialogContent=function(a){var c=this,d=this._getOptionVal("searchable"),b=this._getOptionVal("externalSearchField");a.append(this._getOption("template")({id:this._getOptionVal("id"),tabs:this.tabs,searchable:!b&&d,searchPlaceholder:this._getOptionVal("searchPlaceholder"),extraClasses:this._getOptionVal("extraClasses")}));a.closest(".aui-inline-dialog").addClass("searchable-selector-dialog");
d&&!b&&(this.$searchField=a.find("input.filter"),this._initialiseSearchOnInput());this.tabs&&(b=a.find("ul.tabs-menu a"),b.on("tabSelect",function(a,b){c.currentTabId=b.tab.parent().data("tab-id");(c._getOptionVal("searchable")||0===c._getDataStoreForScrollable().length)&&c._populateScrollable();c._resultsKeyboardController.setListElement(c._getCurrentScrollable().$scrollElement.find("ul.results-list"));d&&c.$searchField.focus();c._updateSearchPlaceholder()}),b.on("click",function(a){e(this).parent().hasClass("active-tab")&&
(a.stopPropagation(),a.preventDefault())}),b.on("keydown",function(a){if(a.keyCode===g.keyCode.ENTER){var c=e(this);c.parent("li").hasClass("active-tab")?a.preventDefault():c.click()}}),g.tabs.setup());a.find(".results").each(function(){c.scrollables.push(c._createScrollable(e(this)));c.scrollableDataStores.push([])});a.on("click",".result a",function(a){c.selectItem(a,e(this))});this._initialiseKeyboardNavigation(a);this._initialiseMouseNavigation(a);this._populateScrollable();this.$content=a;a.data("initialised",
!0)};b.prototype._initialiseSearchOnInput=function(){var a=this,c=this._getSearchTerm(),d=this._getOptionVal("externalSearchField"),b=t.delay(f.bind(this._handleSearchInput,this),350),e=f.bind(function(){c!==(c=this._getSearchTerm())&&(this._pendingSearch?this._pendingSearch.reset(c):(this._pendingSearch=b(c),this._pendingSearch.always(function(){a._pendingSearch=null})))},this);this.$searchField.on("keydown.searchable-selector input.searchable-selector",f.bind(function(b){d&&(b.which===g.keyCode.ESCAPE?
this._pendingSearch&&this._pendingSearch.abort():b.which===g.keyCode.DOWN&&this._shouldSearch(c)?this.dialog.show():b.which!==g.keyCode.ENTER||this.dialog.is(":visible")||this._pendingSearch&&this._pendingSearch.done(function(){var c=a._getCurrentScrollable().$scrollElement.find("ul.results-list li.result:first");a._clickItem(c)}));f.defer(e)},this))};b.prototype._handleSearchInput=function(a){if(this._getOptionVal("externalSearchField")){if(this._shouldSearch(a))return this.dialog.is(":visible")||
this.dialog.show(),this._populateScrollable();this.dialog.hide();return e.Deferred().reject().promise()}return this._populateScrollable()};b.prototype._initialiseKeyboardNavigation=function(a){var c=this,d,b=!1,e=function(a){var d=c.dialog.is(":visible");if(!c._getOptionVal("externalSearchField")||d)b&&!d?c.$trigger.click():c._clickItem(a)};this._resultsKeyboardController&&this._resultsKeyboardController.destroy();this.$searchField?d=this.$searchField:this.tabs?d=a.find("ul.tabs-menu"):(d=this.$trigger,
b=!0);var f=c._getCurrentScrollable().$scrollElement.find("ul.results-list");this._resultsKeyboardController=new w(d,f,{wrapAround:!1,focusedClass:"focused",itemSelector:"li.result",requestMore:function(){var a=c._getCurrentScrollable().loadAfter();return a&&a.then(function(a){return a.isLastPage})},onSelect:function(a){c._pendingSearch?c._pendingSearch.done(function(){var a=f.find("li.result:first");a.length&&e(a)}):e(a)},focusIntoView:!0,adjacentItems:c._getOptionVal("adjacentItems")});this._tabKeyboardController&&
this._tabKeyboardController.destroy();(m.isMozilla()||m.isWebkit())&&a.addClass("override-focus-style");this._tabKeyboardController=new v(a)};b.prototype._initialiseMouseNavigation=function(a){a.on("mousemove","li",function(){e(this).find(".focused").hasClass("focused")||(a.find(".focused").removeClass("focused"),e(this).addClass("focused"))})};b.prototype._clickItem=function(a){a.children("a").each(function(){this.click()})};b.prototype.setFocus=function(){this.$searchField?this.$searchField.focus():
this.tabs?this.$content.find("ul.tabs-menu a").first().focus():this.$trigger.focus()};b.prototype._createScrollable=function(a){a=new u(a,{pageSize:this._getOptionVal("pageSize"),bufferPixels:0,preventOverscroll:!0,paginationContext:this.options.paginationContext});a.requestData=f.bind(this.getResults,this,a);a.attachNewContent=f.bind(this.addResultsToList,this,a,!1);return a};b.prototype._populateScrollable=function(a){a=a||this._getCurrentScrollable();this._emptyScrollable(a);var c=this._getPreloadData(),
d=0;c&&(d=this.addResultsToList(a,!0,c));a=a.init();return 0<d?e.Deferred().resolve().promise():a};b.prototype._getPreloadData=function(){var a=this._getOptionVal("preloadData"),c=this._getSearchTerm();if(a&&(this._getOptionVal("alwaysShowPreload")||""===c)){var d=this._getOption("dataTransform");f.isFunction(d)&&(a=d.call(this,a,c))}else a=null;return a};b.prototype._emptyScrollable=function(a){a=a||this._getCurrentScrollable();a.reset();this._getDataStoreForScrollable(a).length=0;this._getOptionVal("clearResultsOnSearch")&&
a.$scrollElement.children("ul.results-list").empty()};b.prototype._getCurrentScrollable=function(){return this.scrollables[this.tabs&&this.currentTabId?this.currentTabId:0]};b.prototype._getDataStoreForScrollable=function(a){if(!a)return this.scrollableDataStores[this.tabs&&this.currentTabId?this.currentTabId:0];a=f.indexOf(this.scrollables,a);return-1!==a?this.scrollableDataStores[a]:null};b.prototype._getSearchTerm=function(){return this.$searchField?this.$searchField.val():""};b.prototype._updateSearchPlaceholder=
function(){this.$searchField&&this.$searchField.attr("placeholder",this._getOptionVal("searchPlaceholder"))};b.prototype._getOptionVal=function(a){return this._getOption(a,!0)};b.prototype._getOption=function(a,c){var d;d=this.tabs&&f.contains(this.tabOptionKeys,a)?this.tabs[this.currentTabId||0][a]:this.options[a];return c?f.isFunction(d)?d.call(this):d:d};b.prototype.setOptions=function(a){this.options=e.extend(!0,{},this.defaults,a)};b.prototype.getResults=function(a,c,d){var b=this;this.currentXHR&&
this.currentXHR.abort&&this.currentXHR.abort();c=(this._getOption("queryParamsBuilder")||this._defaultQueryParamsBuilder).call(this,this._getSearchTerm(),c,d);if(null===c)return e.Deferred().reject().promise();d=a.$scrollElement.children("ul.results-list");this._showSpinner(a);d.scrollTop(d[0].scrollHeight);c=this.currentXHR=p.rest({url:this._getOptionVal("url"),data:c,statusCode:this._getOptionVal("statusCodeHandlers")});c.always(function(){b._hideSpinner(a);b.currentXHR=null});return c};b.prototype._showSpinner=
function(a){a.$scrollElement.children(".spinner").show().spin()};b.prototype._hideSpinner=function(a){a.$scrollElement.children(".spinner").spinStop().hide()};b.prototype._shouldSearch=function(a){return null!=(this._getOption("queryParamsBuilder")||this._defaultQueryParamsBuilder).call(this,a,0,this._getOptionVal("pageSize"))};b.prototype._defaultQueryParamsBuilder=function(a,c,b){c={start:c,limit:b};this._getOptionVal("searchable")&&(c[this._getOptionVal("queryParamKey")]=a);return c};b.prototype.addResultsToList=
function(a,c,b){var k=this._getOption("dataTransform"),h;f.isFunction(k)&&(b=k.call(this,b,this._getSearchTerm()));!c&&(h=this._getPreloadData())&&(b=this.dedupeData(b,h));b=e.extend({},b,{isPreload:c,noResultsText:this._getOptionVal("noResultsText"),noMoreResultsText:this._getOptionVal("noMoreResultsText")});var k=e(this._getOption("resultsTemplate")(b)),g=this._getDataStoreForScrollable(a);g.push.apply(g,b.values);a=a.$scrollElement.children("ul.results-list");(c=0===b.start&&!(h&&0<h.size)&&(!c||
0<b.size))&&a.empty();a.append(k).attr("data-last-updated",(new Date).getTime());c&&0<b.size&&this._resultsKeyboardController.moveToNext();return b.size};b.prototype.dedupeData=function(a,b){a&&a.values&&b&&b.values&&(a=e.extend(!0,{},a),a.values=f.reject(a.values,function(a){return f.find(b.values,function(b){return a.id===b.id})}));return a};b.prototype.selectItem=function(a,b){var d=b.data("id"),e=f.find(this._getDataStoreForScrollable(),function(a){return a.id===d});("#"===b.attr("href")||!this._getOptionVal("followLinks")&&
q.openInSameTab)&&a.preventDefault();this._selectedItem&&this._selectedItem.id===e.id||this._itemSelected(e);this._getOptionVal("hideDialogOnSelect")&&this.dialog.hide()};b.prototype._itemSelected=function(a){this._selectedItem=a;this._getOptionVal("field")&&e(this._getOptionVal("field")).val(a.id);this.updateTrigger({item:a});r.trigger(this._getOptionVal("itemSelectedEvent"),this,a,this._getOptionVal("context"))};b.prototype.updateTrigger=function(a,b){this._getOptionVal("externalSearchField")||
(this.$trigger.html(this._getOption("triggerContentTemplate")(a||{})),b&&this.$trigger.attr("title",b));this.$trigger.trigger("change")};b.prototype.resetTrigger=function(){this.updateTrigger({text:this._getOptionVal("triggerPlaceholder")})};b.prototype.destroy=function(){this.blockShortcutPropagation&&e(document).add(this.dialog).off("keydown keypress",this.blockShortcutPropagation);this._getOptionVal("externalSearchField")&&this.$searchField.off(".searchable-selector");this.dialog&&(this.dialog.hide(),
this.dialog.remove(),this.dialog=null);this._resultsKeyboardController&&(this._resultsKeyboardController.destroy(),this._resultsKeyboardController=null);this._tabKeyboardController&&(this._tabKeyboardController.destroy(),this._tabKeyboardController=null);this.tabs=this.scrollableDataStores=this.scrollables=this.$trigger=null;this._initialiseDialogContent=e.noop};return b});