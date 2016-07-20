define("bitbucket/internal/feature/repository/branch-table","aui jquery lodash bitbucket/util/navbuilder bitbucket/internal/model/page-state bitbucket/internal/util/events bitbucket/internal/widget/paged-table".split(" "),function(d,e,l,m,n,g,f){function h(a){if(!a)throw Error("Undefined ref");if(!a.id)throw Error("Ref without id");return a}function b(a,c){f.call(this,e.extend({},b.defaults,a));this._baseRef=h(c)}b.defaults={filterable:!0,pageSize:20,noneFoundMessageHtml:d.escapeHtml(d.I18n.getText("bitbucket.web.repository.branch.table.no.branches")),
noneMatchingMessageHtml:d.escapeHtml(d.I18n.getText("bitbucket.web.repository.branch.table.no.matches")),idForEntity:function(a){return a.id},paginationContext:"branch-table"};e.extend(b.prototype,f.prototype);b.prototype.buildUrl=function(a,c,k){var b=JSON.stringify({withMessages:!1});a={base:this._baseRef.id,details:!0,start:a,limit:c,orderBy:"MODIFICATION",context:b};k&&(a.filterText=k);return m.rest().currentRepo().branches().withParams(a).build()};b.prototype.handleNewRows=function(a,c){this.$table.find("tbody")[c](bitbucket.internal.feature.repository.branchRows({branches:a.values,
baseRef:this._baseRef,repository:n.getRepository().toJSON()}))};b.prototype.isCurrentBase=function(a){return this._baseRef.id===h(a).id};b.prototype.update=function(a,c){a&&(this._baseRef=h(a));f.prototype.update.call(this,c)};b.prototype.remove=function(a){if(f.prototype.remove.call(this,a)){var c=this.$table.find('tbody \x3e tr[data-id\x3d"'+a.id+'"]');c.fadeOut(l.bind(function(){if(c.hasClass("focused")){var a=c.next(),a=a.length?a:c.prev();a.length&&(a.addClass("focused"),a.find("td[headers\x3dbranch-name-column] \x3e a").focus())}c.remove();
this.loadedRange.reachedStart()&&this.loadedRange.reachedEnd()&&!this.$table.find("tbody \x3e tr").length&&this.handleNoData();this.updateTimestamp()},this));return!0}return!1};b.prototype.initShortcuts=function(){f.prototype.initShortcuts.call(this);var a=this.options.focusOptions,c=this.$table.selector+" "+a.rowSelector,b=c+"."+a.focusedClass;g.on("bitbucket.internal.keyboard.shortcuts.requestMoveToNextHandler",function(b){(this.moveToNextItem?this:d.whenIType(b)).moveToNextItem(c,a).execute(function(){e(c).last().hasClass(a.focusedClass)&&
window.scrollTo(0,document.documentElement.scrollHeight)})});g.on("bitbucket.internal.keyboard.shortcuts.requestMoveToPreviousHandler",function(b){(this.moveToPrevItem?this:d.whenIType(b)).moveToPrevItem(c,a)});g.on("bitbucket.internal.keyboard.shortcuts.requestOpenItemHandler",function(a){(this.execute?this:d.whenIType(a)).execute(function(){var a=e(b);a.length&&(location.href=a.find("td[headers\x3dbranch-name-column] a").attr("href"))})});g.on("bitbucket.internal.keyboard.shortcuts.requestOpenItemActionHandler",
function(a){(this.execute?this:d.whenIType(a)).execute(function(){var a=e(b);a.length&&a.find(".branch-list-action-trigger").click()})})};return b});