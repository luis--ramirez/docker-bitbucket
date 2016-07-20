define("bitbucket/util/navbuilder","aui jquery lib/jsuri lodash bitbucket/internal/model/page-state bitbucket/internal/model/path exports".split(" "),function(g,C,da,e,h,r,f){function c(a,b,d){this.components=(e.isString(a)?[a]:a)||[];this.params=b||{};this.anchor=d||void 0}function u(a){if("string"===typeof a)return a;if(!a)throw Error(g.I18n.getText("bitbucket.web.error.no.project"));return a.getKey?a.getKey():a.key}function v(){if(h.getProject())return h.getProject();throw Error(g.I18n.getText("bitbucket.web.error.no.project.context"));
}function w(a){if("string"===typeof a)return a;if(!a)throw Error(g.I18n.getText("bitbucket.web.error.no.repo"));return a.getSlug?a.getSlug():a.slug}function ea(a){if("string"===typeof a)return a;if(!a)throw Error(g.I18n.getText("bitbucket.web.error.no.hook.key"));return a.getDetails().getKey()}function D(){if(h.getRepository())return h.getRepository();throw Error(g.I18n.getText("bitbucket.web.error.no.repo.context"));}function E(a){if(0!==a&&!a)throw Error(g.I18n.getText("bitbucket.web.error.no.pull-request.id"));
return("undefined"===typeof a?"undefined":babelHelpers.typeof(a))in{string:1,number:1}?a:a.getId?a.getId():a.id}function F(){if(h.getPullRequest())return h.getPullRequest();throw Error(g.I18n.getText("bitbucket.web.error.no.pull-request.context"));}function t(a){var b=/~(.*)/.exec(a.components[1]);return b?new c(["users",b[1].toLowerCase()]):a}function m(a){if(1===a.length){if(a[0]&&a[0].components)return a[0].components;if(a[0]&&a[0].getComponents)return a[0].getComponents();if(C.isArray(a[0]))return a[0]}return e.toArray(a)}
function x(a){if("string"!==typeof a){a=g.contextPath();var b=location.pathname;0<a.length&&(b=b.substring(b.indexOf(a)+a.length));a=b+location.search+location.hash}return this._path().addParams({next:a}).makeBuilder()}function G(){return(new c("getting-started")).makeBuilder({next:x})}function H(a){a=new c(["projects",u(a)]);return t(a).makeBuilder({allRepos:I,repo:fa,createRepo:function(){return t(this._path()).pushComponents("repos").addParams("create").makeBuilder()},settings:function(){return this._path().pushComponents("settings").makeBuilder()},
permissions:n,remove:function(){return this._path().makeBuilder()},users:y,groups:z,avatar:function(a){var d=this._path().pushComponents("avatar.svg");a&&(d=d.addParams({s:a}));return d.makeBuilder()}})}function J(){return H(v())}function K(){var a=v(),a=u(a);return this._path().pushComponents("projects",a).makeBuilder({repo:ga})}function ha(){return K.call(this).repo(D())}function ga(a){a=w(a);return this._path().pushComponents("repos",a).makeBuilder()}function n(){return this._path().pushComponents("permissions").makeBuilder({permission:ia,
users:y,groups:z})}function ia(a){return this._path().pushComponents(a).makeBuilder({users:function(){return this._path().pushComponents("users").makeBuilder()},groups:function(){return this._path().pushComponents("groups").makeBuilder()},all:function(){return this._path().pushComponents("all").makeBuilder()}})}function y(){return this._path().pushComponents("users").makeBuilder({create:L,deleteUser:M,captcha:function(a){return this._path().pushComponents("captcha").addParams({name:a}).makeBuilder()},
view:N,filter:O,deleteSuccess:P,permissions:n,none:Q})}function z(){return this._path().pushComponents("groups").makeBuilder({create:L,deleteGroup:M,view:N,filter:O,deleteSuccess:P,permissions:n,none:Q})}function Q(){return this._path().pushComponents("none").makeBuilder()}function I(){return t(this._path()).pushComponents("repos").makeBuilder()}function L(){return this._path().addParams({create:""}).makeBuilder()}function M(a){return this._path().addParams({name:a}).makeBuilder()}function N(a){return this._path().pushComponents("view").addParams({name:a}).makeBuilder()}
function O(a){return this._path().addParams({filter:a}).makeBuilder()}function P(a){return this._path().addParams({deleted:a}).makeBuilder()}function fa(a){return t(this._path()).pushComponents("repos",w(a)).makeBuilder({browse:function(){return this._path().pushComponents("browse").makeBuilder(p)},raw:function(){return this._path().pushComponents("raw").makeBuilder(p)},diff:ja,commits:function(){return this._path().pushComponents("commits").makeBuilder({until:function(a){var d=this._path();a&&!a.isDefault&&
("string"!==typeof a&&(a=a.displayId||a),d=d.addParams({until:a}));return d.makeBuilder()}})},branches:function(a){var d=this._path().pushComponents("branches");a&&!a.isDefault&&("string"!==typeof a&&(a=a.displayId||a.id||a),d=d.addParams({base:a}));return d.makeBuilder()},commit:ka,compare:function(){function a(b){return function(){return this._path().pushComponents(b).makeBuilder(q)}}return this._path().pushComponents("compare").makeBuilder(e.extend({commits:a("commits"),diff:a("diff")},A))},settings:function(){return this._path().pushComponents("settings").makeBuilder()},
permissions:n,hooks:R,clone:function(a){var d=this._path(),l=d.components[1].toLowerCase(),la=d.components[3].toLowerCase();"users"===d.components[0]&&(l="~"+l);return(new c(["scm",l,la+"."+a],d.params)).makeBuilder()},fork:function(){return this._path().addParams("fork").makeBuilder()},allPullRequests:function(){return this._path().pushComponents("pull-requests").makeBuilder()},createPullRequest:function(){return this._path().pushComponents("pull-requests").addParams("create").makeBuilder(q)},pullRequest:ma,
attachments:function(){return this._path().pushComponents("attachments").makeBuilder()},sizes:function(){return this._path().pushComponents("sizes").makeBuilder()},build:function(){return this._path().pushComponents("browse").toString()}})}function S(){return J().repo(h.getRepository())}function ja(a,b,d,l){var c=this._path(),f=a.commitRange&&a.path,e;if(a.getCommitRange&&a.getPath&&a.getSrcPath||f)e=a.toJSON?a.toJSON():a;e?(a=e.commitRange,d=d||e.path,d=d.attributes?d:new r(d),a.pullRequest?c=c.pushComponents("pull-requests",
a.pullRequest.id):(f=(new r(e.path)).toString(),c=c.addParams(C.extend({},{autoSincePath:!1!==l||e.srcPath?void 0:l,since:a.sinceRevision&&a.sinceRevision.id||void 0,sincePath:e.srcPath&&(new r(e.srcPath)).toString()||void 0,until:a.untilRevision&&a.untilRevision.id||void 0,untilPath:d.toString()!==f?f:void 0})))):d=a;c=c.pushComponents("diff");c=c.pushComponents.apply(c,m([d]));c=c.makeBuilder(k);b&&!b.isDefault()&&(c=c.at(b.getId()));return c}function ka(a){return this._path().pushComponents("commits",
a).makeBuilder({comment:function(a){return this._path().addParams({commentId:a}).makeBuilder()}})}function R(){return this._path().pushComponents("settings","hooks").makeBuilder()}function ma(a){var b={change:function(a){return this._path().withFragment(a).makeBuilder()}};return this._path().pushComponents("pull-requests",E(a)).makeBuilder({unwatch:function(){return this._path().pushComponents("unwatch").makeBuilder()},commit:function(a){return this._path().pushComponents("commits",a).makeBuilder(b)},
overview:function(){return this._path().pushComponents("overview").makeBuilder({comment:function(a){return this._path().addParams({commentId:a}).makeBuilder()},activity:function(a){return this._path().addParams({activityId:a}).makeBuilder()}})},diff:function(){return this._path().pushComponents("diff").makeBuilder(b)},commits:function(){return this._path().pushComponents("commits").makeBuilder()},build:function(){return this._path().pushComponents("overview").toString()}})}function T(a){a=u(a);return this._path().pushComponents("projects",
a).makeBuilder({allRepos:function(){return this._path().pushComponents("repos").makeBuilder()},repo:na,permissions:oa})}function U(){return T.call(this,v())}function V(){return U.call(this).repo(D())}function pa(a){a=ea(a);return this._path().pushComponents("settings").pushComponents("hooks",a).makeBuilder({enabled:function(){return this._path().pushComponents("enabled").makeBuilder()},settings:function(){return this._path().pushComponents("settings").makeBuilder()}})}function na(a){a=w(a);return this._path().pushComponents("repos",
a).makeBuilder({tags:function(){return this._path().pushComponents("tags").makeBuilder()},branches:function(){return this._path().pushComponents("branches").makeBuilder()},commits:function(){return this._path().pushComponents("commits").makeBuilder()},commit:qa,compare:function(){var a=function(a,b){var d={};d[a]=b;return this._path().addParams(d).makeBuilder(c)},d=function(a){return function(){return this._path().pushComponents(a).makeBuilder(c)}},c={from:e.partial(a,"from"),to:e.partial(a,"to"),
fromRepo:e.partial(a,"fromRepo")};return this._path().pushComponents("compare").makeBuilder({changes:d("changes"),commits:d("commits"),diff:function(a){return W.call(this,a,c)}})},changes:function(a){a=a.toJSON?a.toJSON():a;if(a.pullRequest)return this.pullRequest(a.pullRequest).changes();if(a.untilRevision)return this.commit(a).changes();throw Error("A valid commit-range is required to retrieve changes");},browse:function(){return this._path().pushComponents("browse").makeBuilder(p)},raw:function(){return this._path().pushComponents("raw").makeBuilder(p)},
files:ra,related:function(){return this._path().pushComponents("related").makeBuilder()},participants:function(){return this._path().pushComponents("participants").makeBuilder()},pullRequest:sa,allPullRequests:function(){return this._path().pushComponents("pull-requests").makeBuilder()},hooks:R,hook:pa,lastModified:function(){return this._path().pushComponents("last-modified").makeBuilder(p)}})}function sa(a){a=E(a);return this._path().pushComponents("pull-requests",a).makeBuilder({activities:function(){return this._path().pushComponents("activities").makeBuilder()},
approve:function(){return this._path().pushComponents("approve").makeBuilder()},comment:function d(a){return this._path().pushComponents("comments",a).makeBuilder({comment:d})},comments:function(){return this._path().pushComponents("comments").makeBuilder()},commits:function(){return this._path().pushComponents("commits").makeBuilder()},changes:function(){return this._path().pushComponents("changes").makeBuilder()},diff:X,watch:function(){return this._path().pushComponents("watch").makeBuilder()},
merge:function(){return this._path().pushComponents("merge").makeBuilder()},participants:function(a){return a?this._path().pushComponents("participants").pushComponents(a.slug).makeBuilder():this._path().pushComponents("participants").makeBuilder()},reopen:function(){return this._path().pushComponents("reopen").makeBuilder()},decline:function(){return this._path().pushComponents("decline").makeBuilder()}})}function ta(){return V.call(this).pullRequest(F())}function qa(a){a=a.toJSON?a.toJSON():a;var b=
this._path().pushComponents("commits");if("string"===typeof a)b=b.pushComponents(a);else if(a.untilRevision)b=b.pushComponents(a.untilRevision.id),(a=a.sinceRevision&&a.sinceRevision.id)&&(b=b.addParams({since:a}));else throw Error(g.I18n.getText("bitbucket.web.error.no.commit.or.commitRange"));return b.makeBuilder({diff:X,changes:function(){return this._path().pushComponents("changes").makeBuilder(Y)},comments:function(){return this._path().pushComponents("comments").makeBuilder(Y)},watch:function(){return this._path().pushComponents("watch").makeBuilder()}})}
function W(a,b){var d=a.toJSON?a.toJSON():a,c=this._path(),c=c.pushComponents("diff"),c=c.pushComponents.apply(c,m([d.path]));d.srcPath&&(c=c.addParams({srcPath:(new r(d.srcPath)).toString()}));return c.makeBuilder(b)}function X(a){return W.call(this,a)}function ra(){return this._path().pushComponents("files").makeBuilder(ua)}function oa(){return this._path().pushComponents("permissions").makeBuilder({projectRead:function(){return this._path().pushComponents("project-read").makeBuilder({all:Z,anon:function(){return this._path().pushComponents("anon").makeBuilder(aa)}})},
projectWrite:function(){return this._path().pushComponents("project-write").makeBuilder({all:Z})}})}function Z(){return this._path().pushComponents("all").makeBuilder(aa)}function va(){return this._path().pushComponents("hooks").makeBuilder({hook:function(a){return this._path().pushComponents(a).makeBuilder({avatar:function(a){return this._path().pushComponents("avatar").addParams({version:a}).makeBuilder()}})}})}function ba(a){var b=this._path().pushComponents("avatar.png");a&&(b=b.addParams({s:a}));
return b.makeBuilder()}function B(a){return new da(a)}c.prototype.buildRelNoContext=function(){var a="/"+e.map(this.components,encodeURIComponent).join("/"),b=e.reduce(this.params,function(a,b,c){e.isArray(b)||(b=[b]);e.forEach(b,function(b){a.push({key:c,value:b})});return a},[]),b=e.map(b,function(a){var b=encodeURIComponent(a.value);return encodeURIComponent(a.key)+(b?"\x3d"+b:"")}).join("\x26");return a+(b?"?"+b:"")+(this.anchor?"#"+encodeURI(this.anchor):"")};c.prototype.buildRelative=function(){return g.contextPath()+
this.buildRelNoContext()};c.prototype.buildAbsolute=function(){return location.protocol+"//"+location.hostname+(location.port?":"+location.port:"")+this.buildRelative()};c.prototype.toString=function(){return this.buildRelative()};c.prototype.addParams=function(a){var b=new c(this.components,e.extend({},this.params));e.isString(a)?b.params[a]="":a&&(a.hasOwnProperty("queryParams")?b.params=e.extend(b.params,a.queryParams):a.hasOwnProperty("urlMode")||(b.params=e.extend(b.params,a)));return b};c.prototype.withFragment=
function(a){return new c(this.components,this.params,a)};c.prototype.pushComponents=function(){var a=new c(this.components.slice(0),this.params);e.each(e.toArray(arguments).slice(0),function(b){""!==b&&a.components.push(b)});return a};c.prototype.makeBuilder=function(a){var b=this;return e.extend({_path:function(){return b},build:function(){return b.buildRelative()},buildAbsolute:function(){return b.buildAbsolute()},buildNoContext:function(){return b.buildRelNoContext()},parse:function(){return B(this.build())},
withParams:function(c){return b.addParams(c).makeBuilder(a)},withFragment:function(c){return b.withFragment(c).makeBuilder(a)},addPathComponents:function(){return b.pushComponents.apply(b,arguments).makeBuilder(a)}},a)};var k={at:function(a){var b=this._path();a&&("string"!==typeof a&&(a=a.displayId||a),b=b.addParams({at:a}));return b.makeBuilder(k)},until:function(a,b){return this._path().addParams({until:a,untilPath:b?b.toString():void 0}).makeBuilder(k)},raw:function(){return this._path().addParams({raw:""}).makeBuilder(k)}},
p={path:function(){var a=this._path();return a.pushComponents.apply(a,m(arguments)).makeBuilder(k)},at:k.at},q={_builder:null,sourceBranch:function(a){return this._path().addParams({sourceBranch:a}).makeBuilder(this._builder)},targetBranch:function(a){return this._path().addParams({targetBranch:a}).makeBuilder(this._builder)},targetRepo:function(a){return this._path().addParams({targetRepoId:a}).makeBuilder(this._builder)}};q._builder=q;var A=e.extend({build:function(){return this._path().pushComponents("commits").toString()}},
q);A._builder=A;var Y={path:function(a){return this._path().addParams({path:a.toString()}).makeBuilder()}},ca={at:k.at},ua={path:function(){var a=this._path();return a.pushComponents.apply(a,m(arguments)).makeBuilder(ca)},at:ca.at},aa={allow:function(a){return this._path().addParams({allow:a}).makeBuilder()}},wa=/(default-avatar-)\d+(\.png)/;f._avatarUrl=function(a,b){return{build:function(){var c=B(a.avatarUrl);c.getQueryParamValue("s")&&c.replaceQueryParam("s",b);return c.toString().replace(wa,
"$1"+b+"$2")}}};f.addons=function(){return(new c(["plugins","servlet","upm"])).makeBuilder({requests:function(){return this._path().pushComponents("requests","popular").makeBuilder({category:function(a){return this._path().addParams({category:a}).makeBuilder()}})}})};f.admin=function(){return(new c("admin")).makeBuilder({permissions:n,users:y,groups:z,licensing:function(){return this._path().pushComponents("license").makeBuilder({edit:function(){return this._path().addParams({edit:""}).makeBuilder()}})},
mailServer:function(){return this._path().pushComponents("mail-server").makeBuilder()},db:function(){return this._path().pushComponents("db").makeBuilder()}})};f.allProjects=function(){return(new c("projects")).makeBuilder()};f.allRepos=function(){return(new c("repos")).makeBuilder({visibility:function(a){return this._path().addParams({visibility:a}).makeBuilder()}})};f.captcha=function(){return(new c("captcha")).addParams({ts:(new Date).getTime().toString()}).makeBuilder()};f.createProject=function(){return(new c("projects")).addParams("create").makeBuilder()};
f.currentProject=J;f.currentPullRequest=function(){return S.call(this).pullRequest(F())};f.currentRepo=S;f.login=function(){return(new c("login")).makeBuilder({next:x})};f.newBuilder=function(a,b){return(new c(a,b)).makeBuilder()};f.parse=B;f.parseQuery=function(a){return new Query(a)};f.pluginServlets=function(){return(new c(["plugins","servlet"])).makeBuilder({path:function(){var a=this._path();return a.pushComponents.apply(a,m(arguments)).makeBuilder({currentProject:K,currentRepo:ha})}})};f.project=
H;f.rest=function(a,b){return(new c(["rest",a||"api",b||"latest"])).makeBuilder({project:T,currentProject:U,currentRepo:V,currentPullRequest:ta,markup:function(){return this._path().pushComponents("markup").makeBuilder({preview:function(){return this._path().pushComponents("preview").makeBuilder()}})},profile:function(){return this._path().pushComponents("profile").makeBuilder({recent:function(){return this._path().pushComponents("recent").makeBuilder({repos:function(){return this._path().pushComponents("repos").makeBuilder()}})}})},
users:function(a){var b=this._path().pushComponents("users");return a?b.pushComponents(a).makeBuilder({avatar:ba}):b.makeBuilder()},groups:function(){return this._path().pushComponents("groups").makeBuilder()},hooks:va,allRepos:I,admin:function(){return this._path().pushComponents("admin").makeBuilder({users:function(){return this._path().pushComponents("users").makeBuilder()}})}})};f.search=function(a){var b=(new c("plugins")).makeBuilder({next:x}).addPathComponents("servlet","search");a&&(b=b.withParams({q:a}));
return b};f.tmp=function(){return(new c("tmp")).makeBuilder({avatars:function(){return this._path().pushComponents("avatars").makeBuilder()}})};f.user=function(a){var b="users",d;"string"===typeof a?d=a:(d=a.slug,"SERVICE"===a.type&&(b="bots"));return(new c([b,d])).makeBuilder({avatar:ba})};f.welcome=function(){return G()};f.gettingStarted=G});