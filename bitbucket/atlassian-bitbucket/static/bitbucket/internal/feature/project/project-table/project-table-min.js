define("bitbucket/internal/feature/project/project-table",["jquery","bitbucket/util/navbuilder","bitbucket/internal/widget/paged-table"],function(c,e,d){function a(b){b=c.extend({},a.defaults,b);d.call(this,b)}a.defaults={paginationContext:"project-table"};c.extend(a.prototype,d.prototype);a.prototype.buildUrl=function(b,a){return e.allProjects().withParams({start:b,limit:a,avatarSize:bitbucket.internal.widget.avatarSizeInPx({size:"large"})}).build()};a.prototype.handleNewRows=function(a,c){this.$table.find("tbody")[c](bitbucket.internal.feature.project.projectRows({projects:a.values}))};
return a});