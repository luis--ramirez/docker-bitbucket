define("bitbucket/internal/feature/repository/base-repository-selector","aui jquery lodash bitbucket/internal/model/repository bitbucket/internal/util/events bitbucket/internal/widget/searchable-selector".split(" "),function(g,e,f,c,h,d){function b(a,b){return this.init.apply(this,arguments)}e.extend(b.prototype,d.prototype);b.constructDataPageFromPreloadArray=d.constructDataPageFromPreloadArray;b.prototype.defaults=e.extend(!0,{},d.prototype.defaults,{searchable:!1,extraClasses:"base-repository-selector",
resultsTemplate:bitbucket.internal.feature.repository.baseRepositorySelectorResults,triggerContentTemplate:bitbucket.internal.feature.repository.baseRepositorySelectorTriggerContent,searchPlaceholder:g.I18n.getText("bitbucket.web.repository.selector.search.placeholder"),namespace:"base-repository-selector",itemSelectedEvent:"bitbucket.internal.feature.repository.repositorySelector.repositoryChanged",itemDataKey:"repository",paginationContext:"base-repository-selector"});b.prototype._getItemFromTrigger=
function(){var a=this.$trigger.find(".repository");return new c(e.extend({},this._buildObjectFromElementDataAttributes(a),{name:a.children(".name").text()||void 0}))};b.prototype.setSelectedItem=function(a){a instanceof c&&!a.isEqual(this._selectedItem)&&this._itemSelected(a)};b.prototype._itemSelected=function(a){var b;a instanceof c?(b=a,a=a.toJSON()):(a=f.pick(a,f.keys(c.prototype.namedAttributes)),b=new c(a));this._selectedItem=b;this._getOptionVal("field")&&e(this._getOptionVal("field")).val(a.id);
var d=b.getProject().getName()+" / "+b.getName();this.updateTrigger({repository:a},d);h.trigger(this._getOptionVal("itemSelectedEvent"),this,b,this._getOptionVal("context"))};return b});