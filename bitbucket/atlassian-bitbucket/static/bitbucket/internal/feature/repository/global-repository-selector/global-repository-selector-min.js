define("bitbucket/internal/feature/repository/global-repository-selector",["jquery","bitbucket/util/navbuilder","bitbucket/internal/feature/repository/base-repository-selector"],function(e,g,f){function d(a,b){return this.init.apply(this,arguments)}e.extend(d.prototype,f.prototype);d.constructDataPageFromPreloadArray=f.constructDataPageFromPreloadArray;d.prototype.defaults=e.extend(!0,{},f.prototype.defaults,{url:g.rest().allRepos().withParams({avatarSize:bitbucket.internal.widget.avatarSizeInPx({size:"xsmall"})}).build(),
queryParamsBuilder:function(a,b,c){a=e.trim(a);b={start:b,limit:c,permission:this._getOptionVal("permission")};c=a.lastIndexOf("/");-1===c?b.name=a:(b.projectname=a.substr(0,c),b.name=a.substr(c+1));return b},searchable:!0,permission:"REPO_READ"});return d});