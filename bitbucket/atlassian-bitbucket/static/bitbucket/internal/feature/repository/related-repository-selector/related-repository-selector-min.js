define("bitbucket/internal/feature/repository/related-repository-selector",["jquery","bitbucket/util/navbuilder","bitbucket/internal/feature/repository/base-repository-selector","bitbucket/internal/model/page-state"],function(e,f,b,d){function c(a,c){return this.init.apply(this,arguments)}e.extend(c.prototype,b.prototype);c.constructDataPageFromPreloadArray=b.constructDataPageFromPreloadArray;c.prototype.defaults=e.extend(!0,{},b.prototype.defaults,{repository:function(){return d.getRepository()},
preloadData:function(){var a=this._getOptionVal("repository")||d.getRepository();if(!a)return null;var b=[a.toJSON()];(a=a.getOrigin())&&b.push(a);return c.constructDataPageFromPreloadArray(b)},url:function(){var a=this._getOptionVal("repository")||d.getRepository();return f.rest().project(a.getProject()).repo(a).related().withParams({avatarSize:bitbucket.internal.widget.avatarSizeInPx({size:"xsmall"})}).build()}});return c});