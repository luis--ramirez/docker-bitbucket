define("bitbucket/internal/feature/project/project-selector","jquery lodash bitbucket/util/navbuilder bitbucket/internal/model/project bitbucket/internal/util/events bitbucket/internal/widget/searchable-selector".split(" "),function(d,f,g,c,h,e){function a(b,a){return this.init.apply(this,arguments)}d.extend(a.prototype,e.prototype);a.prototype.defaults=d.extend(!0,{},e.prototype.defaults,{url:function(){return g.allProjects().withParams({avatarSize:bitbucket.internal.widget.avatarSizeInPx({size:"xsmall"}),
permission:"PROJECT_ADMIN"}).build()},searchable:!0,queryParamKey:"name",extraClasses:"project-selector",resultsTemplate:bitbucket.internal.feature.project.projectSelectorResults,triggerContentTemplate:bitbucket.internal.feature.project.projectSelectorTriggerContent,searchPlaceholder:"Search for a project",namespace:"project-selector",itemSelectedEvent:"bitbucket.internal.feature.project.projectSelector.projectChanged",itemDataKey:"project",paginationContext:"project-selector"});a.constructDataPageFromPreloadArray=
e.constructDataPageFromPreloadArray;a.prototype._getItemFromTrigger=function(){var b=this.$trigger.find(".project");return new c(this._buildObjectFromElementDataAttributes(b))};a.prototype.setSelectedItem=function(b){b instanceof c&&!b.isEqual(this._selectedItem)&&this._itemSelected(b)};a.prototype._itemSelected=function(b){var a;b instanceof c?(a=b,b=b.toJSON()):(b=f.pick(b,f.keys(c.prototype.namedAttributes)),a=new c(b));this._selectedItem=a;this._getOptionVal("field")&&d(this._getOptionVal("field")).val(a.getId());
this.updateTrigger({project:b},a.getName());h.trigger(this._getOptionVal("itemSelectedEvent"),this,a,this._getOptionVal("context"))};return a});