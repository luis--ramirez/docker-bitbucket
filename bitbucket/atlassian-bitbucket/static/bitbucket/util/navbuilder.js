'use strict';/**
 * The basic idea of the nav builder is to support a chain of method calls that roughly map to the structure and categorisation
 * of parts of Stash. This is referred to as the "Builder API" of navbuilder.
 *
 * E.g. `nav.project('foo').repo('bar').permissions()` will return a builder that can build the URL for the permissions page
 * of the repository with slug 'bar' of the project with key 'foo', while just `nav.project('foo')` will return a builder for a URL to
 * the project page for project 'foo'.
 *
 * At each point in the method chain, the returned object will support methods that return a builder
 * that maps to a concept at a lower level.
 * At most points, `.build()` may be called to build the URL to be used. There are a few places where no URL makes sense.
 *
 * The "Classes" listed in this module describe the methods that can be called from each step in the chain. E.g.
 *
 * ```javascript
 * var adminBuilder = nav.admin(); // adminBuilder will be a {@linkcode bitbucket/util/navbuilder.AdminBuilder}
 * var groupsBuilder = adminBuilder.groups(); // groupsBuilder will be a {@linkcode bitbucket/util/navbuilder.GroupsBuilder}
 * ```
 *
 * **Web Resource:** com.atlassian.bitbucket.server.bitbucket-web-api:navbuilder
 *
 * @example
 * require([
 *     'bitbucket/util/navbuilder',
 *     'bitbucket/util/server'
 * ], function (nav, server) {
 *     server.rest({
 *         url: nav.rest().projects().build()
 *     }).then(doSomethingWithProjects);
 * });
 *
 * @namespace bitbucket/util/navbuilder
 */define('bitbucket/util/navbuilder',['aui','jquery','lib/jsuri','lodash','bitbucket/internal/model/page-state','bitbucket/internal/model/path','exports'],/**
 * @exports bitbucket/util/navbuilder
 */function(AJS,$,Uri,_,pageState,Path,exports){'use strict';/**
     * Encapsulates a URI path and params that make up a query string.
     * This class is immutable - all mutating operations return a new instance.
     *
     * NOTE: The PathAndQuery constructor is not exposed.
     *
     * @private
     * @class PathAndQuery
     * @memberof bitbucket/util/navbuilder
     */function PathAndQuery(components,params,anchor){this.components=(_.isString(components)?[components]:components)||[];this.params=params||{};this.anchor=anchor||undefined;}/**
     * Returns the described URL as a string. The returned URL is relative to the Stash application's
     * context path root. E.g. If Stash is running at example.com/stash, the URL example.com/stash/a/b/c
     * will be returned as /a/b/c.
     * In client-side code, this version of the URL is rarely useful. bitbucket/util/navbuilder.PathAndQuery.buildRelative is
     * likely to be what you want to use.
     *
     * @name bitbucket/util/navbuilder.PathAndQuery#buildRelNoContext
     * @returns {string}
     */PathAndQuery.prototype.buildRelNoContext=function(){var path='/'+_.map(this.components,encodeURIComponent).join('/');var params=_.reduce(this.params,function(memo,values,key){if(!_.isArray(values)){values=[values];}_.forEach(values,function(value){memo.push({key:key,value:value});});return memo;},[]);var query=_.map(params,function(param){var encodedValue=encodeURIComponent(param.value);return encodeURIComponent(param.key)+(encodedValue?'='+encodedValue:'');}).join("&");return path+(query?'?'+query:'')+(this.anchor?'#'+encodeURI(this.anchor):'');};/**
     * Returns the described URL as a string. The returned URL is relative to the server root. E.g.
     * If Stash is running at example.com/stash, the URL example.com/stash/a/b/c
     * will be returned as /stash/a/b/c.
     *
     * bitbucket/util/navbuilder.PathAndQuery.buildRelative
     * @returns {string}
     */PathAndQuery.prototype.buildRelative=function(){return AJS.contextPath()+this.buildRelNoContext();};/**
     * Returns the described URL as a string. The returned URL is absolute. E.g.
     * If Stash is running at example.com/stash, the URL example.com/stash/a/b/c
     * will be returned as http://example.com/stash/a/b/c.
     *
     * bitbucket/util/navbuilder.PathAndQuery.buildAbsolute
     * @returns {string}
     */PathAndQuery.prototype.buildAbsolute=function(){return location.protocol+"//"+location.hostname+(location.port?':'+location.port:'')+this.buildRelative();};PathAndQuery.prototype.toString=function(){return this.buildRelative();};/**
     * Adds query parameters. If a map (object) is supplied, its properties are added to the parameters.
     * If a single string is supplied, it is added as a query parameter with no value.
     *
     * @name bitbucket/util/navbuilder.PathAndQuery#addParams
     * @returns a new PathAndQuery object with the updated query params
     */PathAndQuery.prototype.addParams=function(params){var path=new PathAndQuery(this.components,_.extend({},this.params));if(_.isString(params)){path.params[params]='';}else if(params){if(params.hasOwnProperty("queryParams")){path.params=_.extend(path.params,params.queryParams);}else if(!params.hasOwnProperty("urlMode")){path.params=_.extend(path.params,params);}// todo - implement urlMode
}return path;};/**
     * Sets the document hash. If a hash has been set previously, it is overwritten
     *
     * @name bitbucket/util/navbuilder.PathAndQuery#withFragment
     * @return a new PathAndQuery object with unchanged path and query string params, but with a new anchor
     */PathAndQuery.prototype.withFragment=function(anchor){return new PathAndQuery(this.components,this.params,anchor);};/**
     * Pushes a new path component onto the list of path components.
     *
     * @name bitbucket/util/navbuilder.PathAndQuery#pushComponents
     * @returns a new PathAndQuery object with the updated query params
     */PathAndQuery.prototype.pushComponents=function(){var path=new PathAndQuery(this.components.slice(0),this.params);_.each(_.toArray(arguments).slice(0),function(component){if(component!==''){path.components.push(component);}});return path;};/**
     * A Builder of URLs. All methods in the Builder API will return a subclass of this and will include these methods.
     *
     *
     * NOTE: The Builder constructor is not exposed. A new Builder can be created through
     * {@linkcode bitbucket/util/navbuilder.newBuilder}.
     *
     * @class Builder
     * @memberof bitbucket/util/navbuilder
     *//**
     * Returns a new builder for the current path with the properties supported by otherMethods.
     * Used after each call in the method chain to construct the next object in the chain and specify
     * exactly which calls are acceptable.
     *
     * @name bitbucket/util/navbuilder.PathAndQuery#makeBuilder
     * @returns {bitbucket/util/navbuilder.Builder} a new builder
     */PathAndQuery.prototype.makeBuilder=function(otherMethods){var path=this;return _.extend(/** @lends bitbucket/util/navbuilder.Builder.prototype */{/**
             * @private
             */_path:function _path(){return path;},/**
             * @returns {string} relative URL. See bitbucket/util/navbuilder.PathAndQuery.buildRelative
             */build:function build(){return path.buildRelative();},/**
             * @returns {string} absolute URL. See bitbucket/util/navbuilder.PathAndQuery.buildAbsolute
             */buildAbsolute:function buildAbsolute(){return path.buildAbsolute();},/**
             * @returns {string} relative URL with not application context. Useful when calling libraries that add
             * the context automatically. See bitbucket/util/navbuilder.PathAndQuery.buildRelNoContext
             */buildNoContext:function buildNoContext(){return path.buildRelNoContext();},/**
             * @returns {bitbucket/util/navbuilder.Uri} URI object formed by the builder.
             */parse:function parse(){return _parse(this.build());},/**
             * Sets query string parameters for the output URL of this builder.
             * @param {Object} params - A map of parameter name to value. Previous params with the same names will be overwritten.
             * @returns {bitbucket/util/navbuilder.Builder}
             */withParams:function withParams(params){//return a new builder with the same methods as the current builder but with added query parameters
return path.addParams(params).makeBuilder(otherMethods);},/**
             * Sets the hash (#) portion of the output URL for this builder.
             * @param {string} anchor - The hash portion of the URL.
             * @returns {bitbucket/util/navbuilder.Builder}
             */withFragment:function withFragment(anchor){return path.withFragment(anchor).makeBuilder(otherMethods);},/**
             * Return a new builder with more path components appended to the URL.
             * @param {...string} component - A path component to append.
             * @returns {bitbucket/util/navbuilder.Builder}
             */addPathComponents:function addPathComponents(){//return a new builder with the same methods as the current builder but with an augmented (new) path
return path.pushComponents.apply(path,arguments).makeBuilder(otherMethods);}},otherMethods);};// id/slug/key helpers
// If the input is a string, it's the key/slug/id.
// Otherwise, if it exists, assume it's a project/repo/PR
// Otherwise, use this pageState's project/repo/PR.
/**
     * @private
     */function getProjectKey(projectOrKey){if(typeof projectOrKey==='string'){return projectOrKey;}else if(!projectOrKey){throw new Error(AJS.I18n.getText('bitbucket.web.error.no.project'));}return projectOrKey.getKey?projectOrKey.getKey():projectOrKey.key;}/**
     * @private
     */function getCurrentProject(){if(pageState.getProject()){return pageState.getProject();}throw new Error(AJS.I18n.getText('bitbucket.web.error.no.project.context'));}/**
     * @private
     */function getRepoSlug(repoOrSlug){if(typeof repoOrSlug==='string'){return repoOrSlug;}else if(!repoOrSlug){throw new Error(AJS.I18n.getText('bitbucket.web.error.no.repo'));}return repoOrSlug.getSlug?repoOrSlug.getSlug():repoOrSlug.slug;}/**
     * @private
     */function getHookKey(hookOrKey){if(typeof hookOrKey==='string'){return hookOrKey;}else if(!hookOrKey){throw new Error(AJS.I18n.getText('bitbucket.web.error.no.hook.key'));}return hookOrKey.getDetails().getKey();}/**
     * @private
     */function getCurrentRepository(){if(pageState.getRepository()){return pageState.getRepository();}throw new Error(AJS.I18n.getText('bitbucket.web.error.no.repo.context'));}/**
     * @private
     */function getPullRequestId(prOrId){if(prOrId!==0&&!prOrId){throw new Error(AJS.I18n.getText('bitbucket.web.error.no.pull-request.id'));}if((typeof prOrId==='undefined'?'undefined':babelHelpers.typeof(prOrId))in{"string":1,"number":1}){return prOrId;}return prOrId.getId?prOrId.getId():prOrId.id;}/**
     * @private
     */function getCurrentPullRequest(){if(pageState.getPullRequest()){return pageState.getPullRequest();}throw new Error(AJS.I18n.getText('bitbucket.web.error.no.pull-request.context'));}/**
     * If the project is a personal project, use the /users/slug form otherwise go with /projects/KEY form
     * @private
     */function maybeResolveAsUserPath(path){var projectKey=path.components[1];var userSlugPattern=/~(.*)/;var result=userSlugPattern.exec(projectKey);if(result){return new PathAndQuery(['users',result[1].toLowerCase()]);}else{return path;}}/**
     * pull path components from an arguments object.  We all .path('a', 'b') and .path(['a', 'b']) both.
     * @param {Array<string>} args
     * @private
     */function componentsFromArguments(args){//accept multiple args or accept a single arg that's an array to support .path('a', 'b') and .path(['a', 'b'])
if(args.length===1){if(args[0]&&args[0].components){// accept a JSON.PathJSON
return args[0].components;}else if(args[0]&&args[0].getComponents){// accept a Path object
return args[0].getComponents();}else if($.isArray(args[0])){return args[0];}}return _.toArray(args);}//----------------------------------------
//Start of Builder API method chains
//----------------------------------------
//--- Methods at the root of the chain ---
/**
     * login-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class LoginBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * @memberof bitbucket/util/navbuilder
     * @returns {bitbucket/util/navbuilder.LoginBuilder}
     */function login(){return new PathAndQuery('login').makeBuilder(/**
             * @lends bitbucket/util/navbuilder.LoginBuilder.prototype
             */{/**
             * @param {string} url - next URL to navigate to after login.
             * @returns {bitbucket/util/navbuilder.Builder}
             */next:_nextUrl});}/**
     * @private
     */function _nextUrl(url){if(typeof url!=='string'){var contextPath=AJS.contextPath();var currentPath=location.pathname;//Make current path relative if context path exist
if(contextPath.length>0){currentPath=currentPath.substring(currentPath.indexOf(contextPath)+contextPath.length);}url=currentPath+location.search+location.hash;}return this._path().addParams({next:url}).makeBuilder();}/**
     * Temporary resource-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class TmpBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * @memberof bitbucket/util/navbuilder
     * @returns {bitbucket/util/navbuilder.TmpBuilder}
     */function tmp(){return new PathAndQuery('tmp').makeBuilder(/**
         * @lends bitbucket/util/navbuilder.TmpBuilder.prototype
         */{/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */avatars:function tmpAvatars(){return this._path().pushComponents('avatars').makeBuilder();}});}/**
     * Welcome page {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class WelcomeBuilder
     * @memberof bitbucket/util/navbuilder
     * @deprecated
     *//**
     * @memberof bitbucket/util/navbuilder
     * @returns {bitbucket/util/navbuilder.WelcomeBuilder}
     */function welcome(){return gettingStarted();}/**
     * Getting Started page {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class GettingStartedBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * @memberof bitbucket/util/navbuilder
     * @returns {bitbucket/util/navbuilder.GettingStartedBuilder}
     */function gettingStarted(){return new PathAndQuery('getting-started').makeBuilder(/**
             * @lends bitbucket/util/navbuilder.GettingStartedBuilder.prototype
             */{/**
                 * @param {string} url - next URL to navigate to after login.
                 * @returns {bitbucket/util/navbuilder.Builder}
                 */next:_nextUrl});}/**
     * Search page {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class SearchBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * @memberof bitbucket/util/navbuilder
     * @returns {bitbucket/util/navbuilder.SearchBuilder}
     */function search(terms){// This is not a good way to build a path to /plugins/servlet/search, but this will look better once search is
// usable at /search
var builder=new PathAndQuery('plugins').makeBuilder(/**
             * @lends bitbucket/util/navbuilder.GettingStartedBuilder.prototype
             */{/**
                 * @param {string} url - next URL to navigate to after login.
                 * @returns {bitbucket/util/navbuilder.Builder}
                 */next:_nextUrl}).addPathComponents('servlet','search');if(terms){builder=builder.withParams({q:terms});}return builder;}/**
     * Admin-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class AdminBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * @memberof bitbucket/util/navbuilder
     * @returns {bitbucket/util/navbuilder.AdminBuilder}
     */function admin(){return new PathAndQuery('admin').makeBuilder(/**
         * @lends bitbucket/util/navbuilder.AdminBuilder.prototype
         */{/**
             * @method
             * @returns {bitbucket/util/navbuilder.PermissionsBuilder}
             */permissions:permissions,/**
             * @method
             * @returns {bitbucket/util/navbuilder.AdminUsersBuilder}
             */users:adminUsers,/**
             * @method
             * @returns {bitbucket/util/navbuilder.GroupsBuilder}
             */groups:groups,/**
             * @method
             * @returns {bitbucket/util/navbuilder.LicenseBuilder}
             */licensing:function licensing(){/**
                 * License-related {@linkcode bitbucket/util/navbuilder.Builder}.
                 *
                 * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
                 *
                 * @class LicenseBuilder
                 * @memberof bitbucket/util/navbuilder
                 */return this._path().pushComponents('license').makeBuilder(/**
                 * @lends bitbucket/util/navbuilder.LicenseBuilder.prototype
                 */{/**
                     * @returns {bitbucket/util/navbuilder.Builder}
                     */edit:function editLicense(){return this._path().addParams({edit:''}).makeBuilder();}});},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */mailServer:function mailServer(){return this._path().pushComponents('mail-server').makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */db:function adminDb(){return this._path().pushComponents('db').makeBuilder();}});}/**
     * @memberof bitbucket/util/navbuilder
     * @returns {bitbucket/util/navbuilder.Builder}
     */function allProjects(){return new PathAndQuery('projects').makeBuilder();}/**
     * {@linkcode bitbucket/util/navbuilder.Builder} for the Stash-wide repository list.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class GlobalRepoBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * @name allRepos
     * @method
     * @memberof bitbucket/util/navbuilder
     * @returns {bitbucket/util/navbuilder.GlobalRepoBuilder}
     */function globalAllRepos(){return new PathAndQuery('repos').makeBuilder(/**
         * @lends bitbucket/util/navbuilder.GlobalRepoBuilder
         */{/**
             * @param {string} visibility - A filter to the shown list of repositories: "public" or "private".
             * @returns {bitbucket/util/navbuilder.Builder}
             */visibility:function allReposWithVisibility(visibility){return this._path().addParams({'visibility':visibility}).makeBuilder();}});}/**
     * @memberof bitbucket/util/navbuilder
     * @returns {bitbucket/util/navbuilder.Builder}
     */function captcha(){//Add a changing query param to ensure all browsers reload the image when refreshing it - some don't respect the HTTP headers
return new PathAndQuery('captcha').addParams({'ts':new Date().getTime().toString()}).makeBuilder();}/**
     * Project-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class ProjectBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * @param {string} projectKey - The key of the project to return a builder for.
     * @returns {bitbucket/util/navbuilder.ProjectBuilder}
     */function project(projectOrKey){var path=new PathAndQuery(['projects',getProjectKey(projectOrKey)]);return maybeResolveAsUserPath(path).makeBuilder(/**
         * @lends bitbucket/util/navbuilder.ProjectBuilder.prototype
         */{/**
             * @method
             * @returns {bitbucket/util/navbuilder.Builder}
             */allRepos:allRepos,/**
             * @method
             * @param {string} slug - The slug of the repository to return a builder for.
             * @returns {bitbucket/util/navbuilder.RepositoryBuilder}
             */repo:repo,/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */createRepo:function createRepo(){return maybeResolveAsUserPath(this._path()).pushComponents('repos').addParams('create').makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */settings:function projSettings(){return this._path().pushComponents('settings').makeBuilder();},/**
             * @method
             * @returns {bitbucket/util/navbuilder.PermissionsBuilder}
             */permissions:permissions,/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */remove:function projDelete(){return this._path().makeBuilder();},/**
             * @method
             * @returns {bitbucket/util/navbuilder.AdminUsersBuilder}
             */users:adminUsers,/**
             * @method
             * @returns {bitbucket/util/navbuilder.GroupsBuilder}
             */groups:groups,/**
             * @param {number} [size] - A pixel value for the height and width of the avatar. Please use only pixel sizes referenced by the ADG at http://developer.atlassian.com/design.
             * @returns {bitbucket/util/navbuilder.Builder}
             */avatar:function projAvatar(size){var builder=this._path().pushComponents('avatar.svg');if(size){builder=builder.addParams({s:size});}return builder.makeBuilder();}});}/**
     * Returns the project builder for the current page's project, if there is one.
     * @memberof bitbucket/util/navbuilder
     * @returns {bitbucket/util/navbuilder.ProjectBuilder}
     */function currentProject(){return project(getCurrentProject());}/**
     * @memberof bitbucket/util/navbuilder
     * @returns {bitbucket/util/navbuilder.Builder}
     */function createProject(){return new PathAndQuery('projects').addParams('create').makeBuilder();}/**
     * REST URL {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class RestBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * Builds REST URLs (e.g. URLs handled by a <rest> plugin module). This method has some shortcuts to help you build
     * common URL shapes for your plugin, and also shapes that are used by the Stash core REST APIs. For example, to build a
     * URL like: 'CONTEXT_PATH/my-rest/1.0/projects/PROJ/repos/REPO/pull-requests/1/a/b' while viewing a pull request, use
     *
     * @example
     * navbuilder.rest('my-rest', '1.0').currentPullRequest().addPathComponents('a', 'b').build();
     *
     * @memberof bitbucket/util/navbuilder
     * @param {String} [resourcePathComponent=api] - The REST module path to build URLs for. The default, "api" points to Stash's core REST API path
     * @param {String} [version=latest] - The version of the API to reference. Since 3.4
     * @returns {bitbucket/util/navbuilder.RestBuilder}
     */function rest(resourcePathComponent,version){resourcePathComponent=resourcePathComponent||'api';version=version||'latest';return new PathAndQuery(['rest',resourcePathComponent,version]).makeBuilder(/**
         * @lends bitbucket/util/navbuilder.RestBuilder.prototype
         */{/**
             * @method
             * @param {string} key - The key of the project to form URLs for.
             * @returns {bitbucket/util/navbuilder.RestProjectBuilder}
             */project:restProj,/**
             * @method
             * @returns {bitbucket/util/navbuilder.RestProjectBuilder}
             */currentProject:restCurrentProject,/**
             * @method
             * @returns {bitbucket/util/navbuilder.RestRepositoryBuilder}
             */currentRepo:restCurrentRepo,/**
             * @method
             * @returns {bitbucket/util/navbuilder.RestPullRequestBuilder}
             */currentPullRequest:restCurrentPullRequest,/**
             * @returns {bitbucket/util/navbuilder.RestMarkupBuilder}
             */markup:function restMarkup(){/**
                 * REST markup URL {@linkcode bitbucket/util/navbuilder.Builder}.
                 *
                 * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
                 *
                 * @class RestMarkupBuilder
                 * @memberof bitbucket/util/navbuilder
                 */return this._path().pushComponents('markup').makeBuilder(/**
                 * @lends bitbucket/util/navbuilder.RestMarkupBuilder.prototype
                 */{/**
                     * @returns {bitbucket/util/navbuilder.Builder}
                     */preview:function restMarkupPreview(){return this._path().pushComponents('preview').makeBuilder();}});},/**
             * @returns {bitbucket/util/navbuilder.RestProfileBuilder}
             */profile:function restProfile(){/**
                 * REST profile URL {@linkcode bitbucket/util/navbuilder.Builder}.
                 *
                 * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
                 *
                 * @class RestProfileBuilder
                 * @memberof bitbucket/util/navbuilder
                 */return this._path().pushComponents('profile').makeBuilder(/**
                 * @lends bitbucket/util/navbuilder.RestProfileBuilder.prototype
                 */{/**
                     * REST recently viewed URL {@linkcode bitbucket/util/navbuilder.Builder}.
                     *
                     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
                     *
                     * @class RestRecentlyViewedBuilder
                     * @memberof bitbucket/util/navbuilder
                     *//**
                     * @returns {bitbucket/util/navbuilder.RestRecentlyViewedBuilder}
                     */recent:function restProfileRecent(){return this._path().pushComponents('recent').makeBuilder(/**
                         * @lends bitbucket/util/navbuilder.RestRecentlyViewedBuilder.prototype
                         */{/**
                             * @returns {bitbucket/util/navbuilder.Builder}
                             */repos:function restProfileRecentRepos(){return this._path().pushComponents('repos').makeBuilder();}});}});},/**
             * @param {string} [userSlug] - If provided, a RestUserBuilder will be returned. Otherwise, a regular builder is returned.
             * @returns {bitbucket/util/navbuilder.Builder|bitbucket/util/navbuilder.RestUserBuilder}
             */users:function restUsers(userSlug){var builder=this._path().pushComponents('users');if(userSlug){/**
                     * {@linkcode bitbucket/util/navbuilder.Builder} for REST user URLs.
                     *
                     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
                     *
                     * @class RestUserBuilder
                     * @memberof bitbucket/util/navbuilder
                     */return builder.pushComponents(userSlug).makeBuilder(/**
                     * @lends bitbucket/util/navbuilder.RestUserBuilder.prototype
                     */{/**
                         * @method
                         * @param {number} [size] - A pixel value for the height and width of the avatar. Please use only pixel sizes referenced by the ADG at http://developer.atlassian.com/design.
                         * @returns {bitbucket/util/navbuilder.Builder}
                         */avatar:userAvatar});}return builder.makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */groups:function restGroups(){return this._path().pushComponents('groups').makeBuilder();},/**
             * @method
             * @returns {bitbucket/util/navbuilder.RestHookPluginsBuilder}
             */hooks:restHookPlugins,/**
             * @method
             * @returns {bitbucket/util/navbuilder.Builder}
             */allRepos:allRepos,/**
             * @returns {bitbucket/util/navbuilder.RestAdminBuilder}
             */admin:function restAdmin(){/**
                 * Admin REST URL {@linkcode bitbucket/util/navbuilder.Builder}.
                 *
                 * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
                 *
                 * @class RestAdminBuilder
                 * @memberof bitbucket/util/navbuilder
                 */return this._path().pushComponents('admin').makeBuilder(/**
                 * @lends bitbucket/util/navbuilder.RestAdminBuilder.prototype
                 */{/**
                     * @returns {bitbucket/util/navbuilder.Builder}
                     */users:function restAdminUsers(){return this._path().pushComponents('users').makeBuilder();}});}});}/**
     * Add-on-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class AddonBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * @memberof bitbucket/util/navbuilder
     * @returns {bitbucket/util/navbuilder.AddonBuilder}
     */function addons(){return new PathAndQuery(['plugins','servlet','upm']).makeBuilder(/**
         * @lends bitbucket/util/navbuilder.AddonBuilder.prototype
         */{/**
             * Add-on-requests-related {@linkcode bitbucket/util/navbuilder.Builder}.
             *
             * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
             *
             * @class AddonRequestsBuilder
             * @memberof bitbucket/util/navbuilder
             *//**
             * @returns {bitbucket/util/navbuilder.AddonRequestsBuilder}
             */requests:function addonsRequests(){return this._path().pushComponents('requests','popular').makeBuilder(/**
                 * @lends bitbucket/util/navbuilder.AddonRequestsBuilder.prototype
                 */{/**
                     * @param {string} category - The category of requests to filter by.
                     * @returns {bitbucket/util/navbuilder.Builder}
                     */category:function category(_category){return this._path().addParams({category:_category}).makeBuilder();}});}});}/**
     * {@linkcode bitbucket/util/navbuilder.Builder} for creating plugin servlet URLs.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class PluginServletsBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * @memberof bitbucket/util/navbuilder
     * @returns {bitbucket/util/navbuilder.PluginServletsBuilder}
     */function pluginServlets(){return new PathAndQuery(['plugins','servlet']).makeBuilder(/**
         * @lends bitbucket/util/navbuilder.PluginServletsBuilder.prototype
         */{/**
             * @param {...string} component - A path component under the servlet.
             * @returns {bitbucket/util/navbuilder.PluginServletsPathBuilder}
             */path:function servletPath(){/**
                 * PluginServlet path-related {@linkcode bitbucket/util/navbuilder.Builder}.
                 *
                 * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
                 *
                 * @class PluginServletsPathBuilder
                 * @memberof bitbucket/util/navbuilder
                 */var path=this._path();return path.pushComponents.apply(path,componentsFromArguments(arguments)).makeBuilder(/**
                     * @lends bitbucket/util/navbuilder.PluginServletsPathBuilder.prototype
                     */{/**
                     * @method
                     * @returns {bitbucket/util/navbuilder.PluginServletsProjectBuilder}
                     */currentProject:pluginCurrentProject,/**
                     * @method
                     * @returns {bitbucket/util/navbuilder.Builder}
                     */currentRepo:pluginCurrentRepo});}});}/**
     * PluginServlet project-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class PluginServletsProjectBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * Documented at parent builder
     * @private
     */function pluginProj(projectOrKey){var key=getProjectKey(projectOrKey);return this._path().pushComponents('projects',key).makeBuilder(/**
             * @lends bitbucket/util/navbuilder.PluginServletsProjectBuilder.prototype
             */{/**
                 * @method
                 * @param {string} slug - The slug of the repo to form URLs for.
                 * @returns {bitbucket/util/navbuilder.Builder}
                 */repo:pluginRepo});}/**
     * Documented at parent builder
     * @private
     */function pluginCurrentProject(){return pluginProj.call(this,getCurrentProject());}/**
     * Documented at parent builder
     * @private
     */function pluginCurrentRepo(){return pluginCurrentProject.call(this).repo(getCurrentRepository());}/**
     * Documented at parent builders
     * @private
     */function pluginRepo(repoOrSlug){var slug=getRepoSlug(repoOrSlug);return this._path().pushComponents('repos',slug).makeBuilder();}/**
     * permissions-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class PermissionsBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * Documented at parent builders
     * @private
     */function permissions(){return this._path().pushComponents('permissions').makeBuilder(/**
         * @lends bitbucket/util/navbuilder.PermissionsBuilder.prototype
         */{/**
             * @method
             * @returns {bitbucket/util/navbuilder.PermissionBuilder}
             */permission:permission,/**
             * @method
             * @returns {bitbucket/util/navbuilder.AdminUsersBuilder}
             */users:adminUsers,/**
             * @method
             * @returns {bitbucket/util/navbuilder.GroupsBuilder}
             */groups:groups});}/**
     * permission-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class PermissionBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * Documented at parent builders
     * @private
     */function permission(name){return this._path().pushComponents(name).makeBuilder(/**
         * @lends bitbucket/util/navbuilder.PermissionBuilder.prototype
         */{/**
             * @returns bitbucket/util/navbuilder.Builder
             */users:function usersPerm(){return this._path().pushComponents('users').makeBuilder();},/**
             * @returns bitbucket/util/navbuilder.Builder
             */groups:function groupsPerm(){return this._path().pushComponents('groups').makeBuilder();},/**
             * @returns bitbucket/util/navbuilder.Builder
             */all:function allPerm(){return this._path().pushComponents('all').makeBuilder();}});}/**
     * Admin user-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class AdminUsersBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * Documented at parent builders
     * @private
     */function adminUsers(){return this._path().pushComponents('users').makeBuilder(/**
         * @lends bitbucket/util/navbuilder.AdminUsersBuilder.prototype
         */{/**
             * @method
             * @returns bitbucket/util/navbuilder.Builder
             */create:createEntity,/**
             * @method
             * @param {string} name - The username of the user to delete.
             * @returns {bitbucket/util/navbuilder.Builder}
             */deleteUser:deleteEntity,/**
             * @param {string} name - The username of the user to read/write captcha info for.
             * @returns {bitbucket/util/navbuilder.Builder}
             */captcha:function adminCaptcha(name){return this._path().pushComponents('captcha').addParams({name:name}).makeBuilder();},/**
             * @method
             * @param {string} name - The username of the user to view.
             * @returns {bitbucket/util/navbuilder.Builder}
             */view:viewEntity,/**
             * @method
             * @param {string} filter - A search string to filter by.
             * @returns {bitbucket/util/navbuilder.Builder}
             */filter:filterEntity,/**
             * @private
             * @param {string} deletedUser - The user who was just deleted.
             * @returns {bitbucket/util/navbuilder.Builder}
             */deleteSuccess:deleteSuccess,/**
             * @method
             * @returns {bitbucket/util/navbuilder.PermissionsBuilder}
             */permissions:permissions,/**
             * @method
             * @returns {bitbucket/util/navbuilder.Builder}
             */none:nonePerm});}/**
     * Group-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class GroupsBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * @private
     */function groups(){return this._path().pushComponents('groups').makeBuilder(/**
         * @lends bitbucket/util/navbuilder.GroupsBuilder.prototype
         */{/**
             * @method
             * @returns bitbucket/util/navbuilder.Builder
             */create:createEntity,/**
             * @method
             * @param {string} name - The name of the group to delete.
             * @returns {bitbucket/util/navbuilder.Builder}
             */deleteGroup:deleteEntity,/**
             * @method
             * @param {string} name - The name of the group to view.
             * @returns {bitbucket/util/navbuilder.Builder}
             */view:viewEntity,/**
             * @method
             * @param {string} filter - A search string to filter by.
             * @returns {bitbucket/util/navbuilder.Builder}
             */filter:filterEntity,/**
             * @private
             * @param {string} deletedUser - The user who was just deleted.
             * @returns {bitbucket/util/navbuilder.Builder}
             */deleteSuccess:deleteSuccess,/**
             * @method
             * @returns {bitbucket/util/navbuilder.PermissionsBuilder}
             */permissions:permissions,/**
             * @method
             * @returns {bitbucket/util/navbuilder.Builder}
             */none:nonePerm});}//--- Methods further down the chain ---
/**
     * Documented at parent builders
     * @private
     */function nonePerm(){return this._path().pushComponents('none').makeBuilder();}/**
     * Documented at parent builders
     * @private
     */function allRepos(){return maybeResolveAsUserPath(this._path()).pushComponents('repos').makeBuilder();}/**
     * User-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class UserBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * @memberof bitbucket/util/navbuilder
     * @param userOrSlug - The URL-safe slug for a user or a full user object.
     * @returns {bitbucket/util/navbuilder.UserBuilder}
     */function user(userOrSlug){var subpath="users";var slug;if(typeof userOrSlug==="string"){slug=userOrSlug;}else{slug=userOrSlug.slug;if(userOrSlug.type==='SERVICE'){subpath="bots";}}return new PathAndQuery([subpath,slug]).makeBuilder(/**
         * @lends bitbucket/util/navbuilder.UserBuilder.prototype
         */{/**
             * @method
             * @param {number} [size] - A pixel value for the height and width of the avatar. Please use only pixel sizes referenced by the ADG at http://developer.atlassian.com/design.
             * @returns {bitbucket/util/navbuilder.Builder}
             */avatar:userAvatar});}/**
     * Documented at parent builders
     * @private
     */function createEntity(){return this._path().addParams({create:''}).makeBuilder();}/**
     * Documented at parent builders
     * @private
     */function deleteEntity(name){// delete is a reserved keyword
return this._path().addParams({name:name}).makeBuilder();}/**
     * Documented at parent builds
     * @private
     */function viewEntity(name){return this._path().pushComponents('view').addParams({name:name}).makeBuilder();}/**
     * Documented at parent builds
     * @private
     */function filterEntity(filterValue){return this._path().addParams({filter:filterValue}).makeBuilder();}/**
     * Documented at parent builds
     * @private
     */function deleteSuccess(name){return this._path().addParams({deleted:name}).makeBuilder();}/**
     * Repository-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class RepositoryBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * @param {string} slug - The slug of the repository to return a builder for.
     * @returns {bitbucket/util/navbuilder.RepositoryBuilder}
     */function repo(repoOrSlug){return maybeResolveAsUserPath(this._path()).pushComponents('repos',getRepoSlug(repoOrSlug)).makeBuilder(/**
         * @lends bitbucket/util/navbuilder.RepositoryBuilder.prototype
         */{/**
             * @returns {bitbucket/util/navbuilder.RepoBrowseBuilder}
             */browse:function repoBrowse(){return this._path().pushComponents('browse').makeBuilder(RepoBrowseBuilderMethods);},/**
             * @returns {bitbucket/util/navbuilder.RepoBrowseBuilder}
             */raw:function repoBrowse(){return this._path().pushComponents('raw').makeBuilder(RepoBrowseBuilderMethods);},/**
             * @method
             * @param {string|JSON.FileChangeJSON} pathOrFileChange - A string to use as the file path to diff, or a FileChangeJSON to specify the revisions and paths together.
             * @returns {bitbucket/util/navbuilder.RevisionSpecifyingBuilder}
             */diff:repoDiff,/**
             * @returns {bitbucket/util/navbuilder.CommitsBuilder}
             */commits:function repoCommits(){/**
                 * Commits list-related {@linkcode bitbucket/util/navbuilder.Builder}.
                 *
                 * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
                 *
                 * @class CommitsBuilder
                 * @memberof bitbucket/util/navbuilder
                 */return this._path().pushComponents('commits').makeBuilder(/**
                 * @lends bitbucket/util/navbuilder.CommitsBuilder.prototype
                 */{/**
                     * @param {string} [until] - The ID of the ref to use as the tip of the commit list. Omit to use the default branch's HEAD.
                     * @returns {bitbucket/util/navbuilder.Builder}
                     */until:function repoCommitsUntil(until){var builder=this._path();if(until&&!until.isDefault){if(typeof until!=='string'){until=until.displayId||until;}builder=builder.addParams({until:until});}return builder.makeBuilder();}});},/**
             * @param {string} [baseRef] - The ID of the ref to use as the base branch for comparisons.
             * @returns {bitbucket/util/navbuilder.Builder}
             */branches:function repoBranches(baseRef){var builder=this._path().pushComponents('branches');if(baseRef&&!baseRef.isDefault){if(typeof baseRef!=='string'){baseRef=baseRef.displayId||baseRef.id||baseRef;}builder=builder.addParams({base:baseRef});}return builder.makeBuilder();},/**
             * @method
             * @param {string} commitId - The ID of the commit to form URLs for.
             * @returns {bitbucket/util/navbuilder.CommitBuilder}
             */commit:repoCommit,/**
             * {@linkcode bitbucket/util/navbuilder.Builder} for branch comparison URLs.
             *
             * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
             *
             * @class BranchCompareBuilder
             * @extends bitbucket/util/navbuilder.SourceTargetBuilder
             * @memberof bitbucket/util/navbuilder
             *//**
             * @returns {bitbucket/util/navbuilder.BranchCompareBuilder}
             */compare:function repoCompare(){function comparePath(path){return function(){//noinspection JSPotentiallyInvalidUsageOfThis
return this._path().pushComponents(path).makeBuilder(secondBranchParamBuilders);};}return this._path().pushComponents('compare').makeBuilder(_.extend(/**
                 * @lends bitbucket/util/navbuilder.BranchCompareBuilder.prototype
                 */{/**
                     * @method
                     * @returns {bitbucket/util/navbuilder.SourceTargetBuilder}
                     */commits:comparePath('commits'),/**
                     * @method
                     * @returns {bitbucket/util/navbuilder.SourceTargetBuilder}
                     */diff:comparePath('diff')},compareDefaultBranchParamBuilders));},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */settings:function repoSettings(){return this._path().pushComponents('settings').makeBuilder();},/**
             * @method
             * @returns {bitbucket/util/navbuilder.PermissionsBuilder}
             */permissions:permissions,/**
             * @method
             * @returns {bitbucket/util/navbuilder.Builder}
             */hooks:repoHooks,/**
             * @param {string} scm - The kind of SCM (e.g. git) for this repo.
             * @returns {bitbucket/util/navbuilder.Builder}
             */clone:function repoClone(scm){var path=this._path();var projectKey=path.components[1].toLowerCase();var repoSlug=path.components[3].toLowerCase();if(path.components[0]==='users'){projectKey="~"+projectKey;}return new PathAndQuery(['scm',projectKey,repoSlug+'.'+scm],path.params).makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */fork:function repoFork(){return this._path().addParams('fork').makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */allPullRequests:function allPullRequests(){return this._path().pushComponents('pull-requests').makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.SourceTargetBuilder}
             */createPullRequest:function createPullRequest(){return this._path().pushComponents('pull-requests').addParams('create').makeBuilder(secondBranchParamBuilders);},/**
             * @method
             * @param {number} pullRequestId - The ID of a pull request to build URLs for.
             * @returns {bitbucket/util/navbuilder.PullRequestBuilder}
             */pullRequest:pullRequest,/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */attachments:function repoAttachments(){return this._path().pushComponents('attachments').makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */sizes:function repoSizes(){return this._path().pushComponents('sizes').makeBuilder();},/**
             * Documented under Builder
             * @private
             */build:function build(){return this._path().pushComponents('browse').toString();//the stem /projects/PROJ/repos is different to the path needed if build() is called
}});}/**
     * Returns the builder for the current page's repository, if there is one.
     * @memberof bitbucket/util/navbuilder
     * @returns {bitbucket/util/navbuilder.RepositoryBuilder}
     */function currentRepo(){return currentProject().repo(pageState.getRepository());}/**
     * {@linkcode bitbucket/util/navbuilder.Builder} to select which commits are involved and whether to retrieve the
     * "raw" version when browsing files within Stash.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class RevisionSpecifyingBuilder
     * @memberof bitbucket/util/navbuilder
     */var RevisionRangeSpecifyingBuilderMethods=/**
         * @lends bitbucket/util/navbuilder.RevisionSpecifyingBuilder.prototype
         */{/**
             * Set the "at" revision for browsing. This revision describes the branch head whose history is being viewed.
             * This is _not_ the actual revision at which to view the file (but it is used as fallback for that purpose).
             * The main purpose of this parameter is to determine which branch to use as "current" in the page layout.
             *
             * @param {string} refId - The ID of a ref or commit in the SCM whose history to browse.
             * @returns {bitbucket/util/navbuilder.RevisionSpecifyingBuilder}
             */at:function repoBrowsePathAt(refId){var builder=this._path();if(refId){if(typeof refId!=='string'){refId=refId.displayId||refId;}builder=builder.addParams({at:refId});}return builder.makeBuilder(RevisionRangeSpecifyingBuilderMethods);},/**
             * Set the "until" commit for browsing. This commit describes the actual revision at which you want to view file content.
             * @param {string} commitId - The ID of a commit in the SCM at which to browse.
             * @param {string} path - the path at this commit. Since we're following renames, the path at this commit might be different from at the head.
             * @returns {bitbucket/util/navbuilder.RevisionSpecifyingBuilder}
             */until:function repoBrowsePathUntil(commitId,path){return this._path().addParams({until:commitId,untilPath:path?path.toString():undefined}).makeBuilder(RevisionRangeSpecifyingBuilderMethods);},/**
             * Describes that you want to view the "raw"/downloadable version of the file, not the HTML version
             * @returns {bitbucket/util/navbuilder.RevisionSpecifyingBuilder}
             */raw:function repoBrowsePathRaw(){return this._path().addParams({raw:''}).makeBuilder(RevisionRangeSpecifyingBuilderMethods);}};/**
     * {@linkcode bitbucket/util/navbuilder.Builder} to select where to browse files.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class RepoBrowseBuilder
     * @memberof bitbucket/util/navbuilder
     */var RepoBrowseBuilderMethods=/**
         * @lends bitbucket/util/navbuilder.RepoBrowseBuilder.prototype
         */{/**
             * @param {...string} components - path components for the file/directory at which to browse.
             * @returns {bitbucket/util/navbuilder.RevisionSpecifyingBuilder}
             */path:function repoBrowsePath(){var path=this._path();return path.pushComponents.apply(path,componentsFromArguments(arguments)).makeBuilder(RevisionRangeSpecifyingBuilderMethods);},/**
             * Set the "at" revision for browsing. This revision describes the branch head whose history is being viewed.
             * This is _not_ the actual revision at which to view the file (but it is used as fallback for that purpose).
             * The main purpose of this parameter is to determine which branch to use as "current" in the page layout.
             *
             * @method
             * @param {string} refId - The ID of a ref or commit in the SCM whose history to browse.
             * @returns {bitbucket/util/navbuilder.RevisionSpecifyingBuilder}
             */at:RevisionRangeSpecifyingBuilderMethods.at};/**
     * Documented at parent builders
     * @private
     */function repoDiff(fileChangeOrPath,headRef,headPath,autoSincePath){var builder=this._path();var path;// Duck-type as adding FileChange as a dependency on navbuilder causes too much recursion in dependency stack
var isFileChange=fileChangeOrPath.getCommitRange&&fileChangeOrPath.getPath&&fileChangeOrPath.getSrcPath;var isFileChangeJSON=fileChangeOrPath.commitRange&&fileChangeOrPath.path;var fileChangeJSON;if(isFileChange||isFileChangeJSON){fileChangeJSON=fileChangeOrPath.toJSON?fileChangeOrPath.toJSON():fileChangeOrPath;}if(fileChangeJSON){var commitRangeJSON=fileChangeJSON.commitRange;path=headPath||fileChangeJSON.path;path=path.attributes?path:new Path(path);if(commitRangeJSON.pullRequest){builder=builder.pushComponents('pull-requests',commitRangeJSON.pullRequest.id);}else{var fileChangePath=new Path(fileChangeJSON.path).toString();// Use of extend will root out undefined props
builder=builder.addParams($.extend({},{autoSincePath:autoSincePath===false&&!fileChangeJSON.srcPath?autoSincePath:undefined,since:commitRangeJSON.sinceRevision&&commitRangeJSON.sinceRevision.id||undefined,sincePath:fileChangeJSON.srcPath&&new Path(fileChangeJSON.srcPath).toString()||undefined,until:commitRangeJSON.untilRevision&&commitRangeJSON.untilRevision.id||undefined,untilPath:path.toString()!==fileChangePath?fileChangePath:undefined}));}}else{path=fileChangeOrPath;}builder=builder.pushComponents('diff');// need to do this separately otherwise we don't have the correct context for the next apply invocation.
builder=builder.pushComponents.apply(builder,componentsFromArguments([path]));builder=builder.makeBuilder(RevisionRangeSpecifyingBuilderMethods);if(headRef&&!headRef.isDefault()){builder=builder.at(headRef.getId());}return builder;}/**
     * {@linkcode bitbucket/util/navbuilder.Builder} for commit-related URLs.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class CommitBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * Documented at parent builders
     * @private
     */function repoCommit(commitId){// commitId must be SHA1 hash
return this._path().pushComponents('commits',commitId).makeBuilder(/**
         * @lends bitbucket/util/navbuilder.CommitBuilder.prototype
         */{/**
             * @param {number} commentId - The commit comment to form URLs for.
             * @returns {bitbucket/util/navbuilder.Builder}
             */comment:function repoCommitComment(commentId){return this._path().addParams({commentId:commentId}).makeBuilder();}});}/**
     * Documented at parent builders
     * @private
     */function repoHooks(){return this._path().pushComponents('settings','hooks').makeBuilder();}//--- Pull Request Methods ---
/**
     * {@linkcode bitbucket/util/navbuilder.Builder} for URLs that have a source and target branch.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class SourceTargetBuilder
     * @memberof bitbucket/util/navbuilder
     */var secondBranchParamBuilders=/**
     * @lends bitbucket/util/navbuilder.SourceTargetBuilder.prototype
     */{/**
         * The builder that will be returned from branch setter methods
         * @private
         */_builder:null,/**
         * @param {string} sourceBranchRefId - The refId for the source branch.
         * @returns {bitbucket/util/navbuilder.SourceTargetBuilder}
         */sourceBranch:function sourceBranch(sourceBranchRefId){return this._path().addParams({sourceBranch:sourceBranchRefId}).makeBuilder(this._builder);},/**
         * @param {string} targetBranchRefId - The refId for the target branch.
         * @returns {bitbucket/util/navbuilder.SourceTargetBuilder}
         */targetBranch:function targetBranch(targetBranchRefId){return this._path().addParams({targetBranch:targetBranchRefId}).makeBuilder(this._builder);},/**
         * @param {string} id - The ID (not slug) for the target repository (containing the target branch).
         * @returns {bitbucket/util/navbuilder.SourceTargetBuilder}
         */targetRepo:function targetRepo(id){return this._path().addParams({targetRepoId:id}).makeBuilder(this._builder);}};// set the builder
secondBranchParamBuilders._builder=secondBranchParamBuilders;var compareDefaultBranchParamBuilders=_.extend({/**
         * Documented under Builder
         * @private
         */build:function build(){return this._path().pushComponents('commits').toString();//the stem /projects/PROJ/repos is different to the path needed if build() is called
}},secondBranchParamBuilders);// set the builder
compareDefaultBranchParamBuilders._builder=compareDefaultBranchParamBuilders;/**
     * Pull request-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class PullRequestBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * Documented at parent builder
     * @private
     */function pullRequest(prOrId){var change=/**
         * @lends bitbucket/util/navbuilder.PullRequestDiffBuilder.prototype
         */{/**
             * @param {string} diffChangePath - The filepath to view the change of, within the PR.
             * @returns {bitbucket/util/navbuilder.Builder}
             */change:function change(diffChangePath){return this._path().withFragment(diffChangePath).makeBuilder();}};return this._path().pushComponents('pull-requests',getPullRequestId(prOrId)).makeBuilder(/**
         * @lends bitbucket/util/navbuilder.PullRequestBuilder.prototype
         */{/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */unwatch:function pullRequestUnwatch(){return this._path().pushComponents('unwatch').makeBuilder();},/**
             * @param {string} [commitId] - The ID of a commit in the pull request.
             * @returns {bitbucket/util/navbuilder.PullRequestDiffBuilder}
             */commit:function pullRequestCommit(commitId){//Unlike repository commits, ref names like "master" are not supported here. As a result, there is
//no need to do all the path gyrations repoCommit does
return this._path().pushComponents('commits',commitId).makeBuilder(change);},/**
             * @returns {bitbucket/util/navbuilder.PullRequestOverviewBuilder}
             */overview:function pullRequestOverview(){/**
                 * Pull request overview URL {@linkcode bitbucket/util/navbuilder.Builder}.
                 *
                 * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
                 *
                 * @class PullRequestOverviewBuilder
                 * @memberof bitbucket/util/navbuilder
                 */return this._path().pushComponents('overview').makeBuilder(/**
                 * @lends bitbucket/util/navbuilder.PullRequestOverviewBuilder.prototype
                 */{/**
                     * @param {number} commentId - The ID of a comment to view within the overview activity.
                     * @returns {bitbucket/util/navbuilder.Builder}
                     */comment:function pullRequestComment(commentId){return this._path().addParams({commentId:commentId}).makeBuilder();},/**
                     * @param {number} activityId - The ID of an activity to view within the overview activity.
                     * @returns {bitbucket/util/navbuilder.Builder}
                     */activity:function pullRequestActivity(activityId){return this._path().addParams({activityId:activityId}).makeBuilder();}});},/**
             * @returns {bitbucket/util/navbuilder.PullRequestDiffBuilder}
             */diff:function pullRequestDiff(){/**
                 * Pull request diff-related {@linkcode bitbucket/util/navbuilder.Builder}.
                 *
                 * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
                 *
                 * @class PullRequestDiffBuilder
                 * @memberof bitbucket/util/navbuilder
                 */return this._path().pushComponents('diff').makeBuilder(change);},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */commits:function pullRequestCommits(){return this._path().pushComponents('commits').makeBuilder();},/**
             * Documented on Builder
             * @private
             */build:function build(){return this._path().pushComponents('overview').toString();//Default to overview view
}});}/**
     * Returns the builder for the current page's pull request, if there is one.
     * @memberof bitbucket/util/navbuilder
     * @returns {bitbucket/util/navbuilder.PullRequestBuilder}
     */function currentPullRequest(){return currentRepo.call(this).pullRequest(getCurrentPullRequest());}/**
     * REST project-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class RestProjectBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * Documented at parent builder
     * @private
     */function restProj(projectOrKey){var key=getProjectKey(projectOrKey);return this._path().pushComponents('projects',key).makeBuilder(/**
         * @lends bitbucket/util/navbuilder.RestProjectBuilder.prototype
         */{/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */allRepos:function restAllRepos(){return this._path().pushComponents('repos').makeBuilder();},/**
             * @method
             * @param {string} slug - The slug of the repo to form URLs for.
             * @returns {bitbucket/util/navbuilder.RestRepositoryBuilder}
             */repo:restRepo,/**
             * @method
             * @returns {bitbucket/util/navbuilder.RestProjectPermissionsBuilder}
             */permissions:restProjPermissions});}/**
     * Documented at parent builder
     * @private
     */function restCurrentProject(){return restProj.call(this,getCurrentProject());}/**
     * Documented at parent builder
     * @private
     */function restCurrentRepo(){return restCurrentProject.call(this).repo(getCurrentRepository());}/**
     * REST repository hook-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class RestHookBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * @param {string} hookKey - The key of the hook you want to build URLs for.
     * @returns {bitbucket/util/navbuilder.RestHookBuilder}
     */function restHook(hookOrKey){var hookKey=getHookKey(hookOrKey);return this._path().pushComponents('settings').pushComponents('hooks',hookKey).makeBuilder(/**
         * @lends bitbucket/util/navbuilder.RestHookBuilder.prototype
         */{/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */enabled:function hookEnabled(){return this._path().pushComponents('enabled').makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */settings:function hookSettings(){return this._path().pushComponents('settings').makeBuilder();}});}/**
     * REST repository-related {@linkcode bitbucket/util/navbuilder.Builder}.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class RestRepositoryBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * Documented at parent builders
     * @private
     */function restRepo(repoOrSlug){var slug=getRepoSlug(repoOrSlug);return this._path().pushComponents('repos',slug).makeBuilder(/**
         * @lends bitbucket/util/navbuilder.RestRepositoryBuilder.prototype
         */{/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */tags:function restRepoTags(){return this._path().pushComponents('tags').makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */branches:function restRepoBranches(){return this._path().pushComponents('branches').makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */commits:function restRepoAllCommits(){return this._path().pushComponents('commits').makeBuilder();},/**
             * @method
             * @param {string|JSON.CommitRangeJSON} commitIdOrCommitRange
             * @returns {bitbucket/util/navbuilder.RestCommitBuilder}
             */commit:restRepoCommit,/**
             * @returns {bitbucket/util/navbuilder.RestRepoCompareBuilder}
             */compare:function restRepoCompare(){/**
                 * REST ref comparison-related {@linkcode bitbucket/util/navbuilder.Builder}.
                 *
                 * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
                 *
                 * @class RestRepoCompareBuilder
                 * @memberof bitbucket/util/navbuilder
                 */var compareParam=function compareParam(name,value){var params={};params[name]=value;return this._path().addParams(params).makeBuilder(paramsBuilder);};var comparePath=function comparePath(path){return function(){return this._path().pushComponents(path).makeBuilder(paramsBuilder);};};/**
                 * {@linkcode bitbucket/util/navbuilder.Builder} for REST ref comparison-related params.
                 *
                 * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
                 *
                 * @class RestRepoCompareParamBuilder
                 * @memberof bitbucket/util/navbuilder
                 */var paramsBuilder=/**
                 * @lends bitbucket/util/navbuilder.RestRepoCompareParamBuilder.prototype
                 */{/**
                     * @method
                     * @param {string} refId - The from/until ref's ID for comparison.
                     * @returns {bitbucket/util/navbuilder.RestRepoCompareParamBuilder}
                     */from:_.partial(compareParam,'from'),/**
                     * @method
                     * @param {string} refId - The to/since ref's ID for comparison.
                     * @returns {bitbucket/util/navbuilder.RestRepoCompareParamBuilder}
                     */to:_.partial(compareParam,'to'),/**
                     * @method
                     * @param {string} repoId - The ID of the repository containing the from/until ref.
                     * @returns {bitbucket/util/navbuilder.RestRepoCompareParamBuilder}
                     */fromRepo:_.partial(compareParam,'fromRepo')};return this._path().pushComponents('compare').makeBuilder(/**
                 * @lends bitbucket/util/navbuilder.RestRepoCompareBuilder.prototype
                 */{/**
                     * @method
                     * @returns {bitbucket/util/navbuilder.RestRepoCompareParamBuilder}
                     */changes:comparePath('changes'),/**
                     * @method
                     * @returns {bitbucket/util/navbuilder.RestRepoCompareParamBuilder}
                     */commits:comparePath('commits'),/**
                     * @method
                     * @param {JSON.FileChangeJSON} fileChange - The fileChange object describing the files to be compared.
                     * @returns {bitbucket/util/navbuilder.RestRepoCompareParamBuilder}
                     */diff:function diff(fileChange){return restDiffInternal.call(this,fileChange,paramsBuilder);}});},/**
             * @param {JSON.CommitRangeJSON} commitRange - describe the range of commits to get changes between.
             * @returns {bitbucket/util/navbuilder.RestCommitPathBuilder|bitbucket/util/navbuilder.Builder}
             */changes:function routeChangesRequest(commitRange){commitRange=commitRange.toJSON?commitRange.toJSON():commitRange;if(commitRange.pullRequest){return this.pullRequest(commitRange.pullRequest).changes();}else if(commitRange.untilRevision){return this.commit(commitRange).changes();}else{throw new Error("A valid commit-range is required to retrieve changes");}},/**
             * @returns {bitbucket/util/navbuilder.RepoBrowseBuilder}
             */browse:function restRepoBrowse(){return this._path().pushComponents('browse').makeBuilder(RepoBrowseBuilderMethods);},/**
             * @returns {bitbucket/util/navbuilder.RepoBrowseBuilder}
             */raw:function restRepoRaw(){//The parameters are exactly the same as for the browse builder, except the endpoint is /raw/
return this._path().pushComponents('raw').makeBuilder(RepoBrowseBuilderMethods);},/**
             * @method
             * @returns {bitbucket/util/navbuilder.RestRepoFilesListBuilder}
             */files:restRepoFind,/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */related:function restRepoRelated(){return this._path().pushComponents('related').makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */participants:function restRepoParticipants(){return this._path().pushComponents('participants').makeBuilder();},/**
             * @method
             * @param {number} id - The ID of a pull request.
             * @returns {bitbucket/util/navbuilder.RestPullRequestBuilder}
             */pullRequest:restPullRequest,/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */allPullRequests:function restAllPullRequests(){return this._path().pushComponents('pull-requests').makeBuilder();},/**
             * @method
             * @returns {bitbucket/util/navbuilder.Builder}
             */hooks:repoHooks,/**
             * @method
             * @param {string} hookKey - The key of the hook to form URLs about.
             * @returns {bitbucket/util/navbuilder.RestHookBuilder}
             */hook:restHook,/**
             * @method
             * @returns {bitbucket/util/navbuilder.RepoBrowseBuilder}
             */lastModified:function lastModified(){return this._path().pushComponents('last-modified').makeBuilder(RepoBrowseBuilderMethods);}});}/**
     * {@linkcode bitbucket/util/navbuilder.Builder} for REST pull request info.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class RestPullRequestBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * Documented at parent builders
     * @private
     */function restPullRequest(prOrId){var id=getPullRequestId(prOrId);return this._path().pushComponents('pull-requests',id).makeBuilder(/**
         * @lends bitbucket/util/navbuilder.RestPullRequestBuilder.prototype
         */{/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */activities:function activities(){return this._path().pushComponents('activities').makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */approve:function restApprove(){return this._path().pushComponents('approve').makeBuilder();},/**
             * @param {number} id - The ID of the comment to generate URLs for.
             * @returns {bitbucket/util/navbuilder.Builder}
             */comment:function restComment(id){return this._path().pushComponents('comments',id).makeBuilder({comment:restComment/* TODO is this legit?!?!?! Not documenting it for now... */});},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */comments:function comments(){return this._path().pushComponents('comments').makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */commits:function commits(){return this._path().pushComponents('commits').makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */changes:function restPullRequestChanges(){return this._path().pushComponents('changes').makeBuilder();},/**
             * @method
             * @param {JSON.FileChangeJSON} fileChange
             * @returns {bitbucket/util/navbuilder.Builder}
             */diff:restDiff,/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */watch:function restPullRequestWatch(){return this._path().pushComponents('watch').makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */merge:function restMerge(){return this._path().pushComponents('merge').makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */participants:function restParticipants(user){if(user){return this._path().pushComponents('participants').pushComponents(user.slug).makeBuilder();}else{return this._path().pushComponents('participants').makeBuilder();}},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */reopen:function restReopen(){return this._path().pushComponents('reopen').makeBuilder();},/**
             * @returns {bitbucket/util/navbuilder.Builder}
             */decline:function restDecline(){return this._path().pushComponents('decline').makeBuilder();}});}/**
     * Documented at parent builders
     * @private
     */function restCurrentPullRequest(){return restCurrentRepo.call(this).pullRequest(getCurrentPullRequest());}/**
     * {@linkcode bitbucket/util/navbuilder.Builder} for REST commit URLs.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class RestCommitBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * Documented at parent builders
     * @private
     */function restRepoCommit(commitIdOrCommitRange){commitIdOrCommitRange=commitIdOrCommitRange.toJSON?commitIdOrCommitRange.toJSON():commitIdOrCommitRange;var path=this._path().pushComponents('commits');if(typeof commitIdOrCommitRange==='string'){path=path.pushComponents(commitIdOrCommitRange);}else if(commitIdOrCommitRange.untilRevision){path=path.pushComponents(commitIdOrCommitRange.untilRevision.id);var sinceId=commitIdOrCommitRange.sinceRevision&&commitIdOrCommitRange.sinceRevision.id;if(sinceId){path=path.addParams({since:sinceId});}}else{throw new Error(AJS.I18n.getText('bitbucket.web.error.no.commit.or.commitRange'));}return path.makeBuilder(/**
         * @lends bitbucket/util/navbuilder.RestCommitBuilder.prototype
         */{/**
             * @method
             * @param {JSON.FileChangeJSON} fileChange
             * @returns {bitbucket/util/navbuilder.Builder}
             */diff:restDiff,/**
             * @returns {bitbucket/util/navbuilder.RestCommitPathBuilder}
             */changes:function restCommitChanges(){return this._path().pushComponents('changes').makeBuilder(restCommitPathBuilderMethods);},/**
             * @returns {bitbucket/util/navbuilder.RestCommitPathBuilder}
             */comments:function restCommitComment(){return this._path().pushComponents('comments').makeBuilder(restCommitPathBuilderMethods);},/**
             * @returns {bitbucket/util/navbuilder.RepoBrowseBuilder}
             */watch:function restCommitWatch(){return this._path().pushComponents('watch').makeBuilder();}});}/**
     * {@linkcode bitbucket/util/navbuilder.Builder} for REST commit path URLs.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class RestCommitPathBuilder
     * @memberof bitbucket/util/navbuilder
     */var restCommitPathBuilderMethods=/**
         * @lends bitbucket/util/navbuilder.RestCommitPathBuilder.prototype
         */{/**
             * @param {string} path - A file path.
             * @returns {bitbucket/util/navbuilder.Builder}
             */path:function restCommitPath(path){return this._path().addParams({path:path.toString()}).makeBuilder();}};/**
     * @private
     */function restDiffInternal(fileChange,builderMethods){var fileChangeJSON=fileChange.toJSON?fileChange.toJSON():fileChange;var builder=this._path();builder=builder.pushComponents('diff');builder=builder.pushComponents.apply(builder,componentsFromArguments([fileChangeJSON.path]));if(fileChangeJSON.srcPath){builder=builder.addParams({srcPath:new Path(fileChangeJSON.srcPath).toString()});}return builder.makeBuilder(builderMethods);}/**
     * Documented at parent builders
     * @private
     */function restDiff(fileChange){return restDiffInternal.call(this,fileChange);}/**
     * @returns {bitbucket/util/navbuilder.RepoBrowseBuilder}
     */function restRepoBrowse(){return this._path().pushComponents('browse').makeBuilder(RepoBrowseBuilderMethods);}/**
     * @returns {bitbucket/util/navbuilder.RepoBrowseBuilder}
     */function restRawBrowse(){return this._path().pushComponents('raw').makeBuilder(RepoBrowseBuilderMethods);}/**
     * {@linkcode bitbucket/util/navbuilder.Builder} for specifying revisions in REST repository files list URLs.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class RestRepoFilesListAtBuilder
     * @memberof bitbucket/util/navbuilder
     */var restRepoFilesListAtBuilderMethods=/**
         * @lends bitbucket/util/navbuilder.RestRepoFilesListAtBuilder.prototype
         */{/**
             * Set the "at" revision at which to obtain a file list from the repo.
             *
             * @method
             * @param {string} refId - The ID of a ref or commit in the SCM whose history to browse.
             * @returns {bitbucket/util/navbuilder.Builder}
             */at:RevisionRangeSpecifyingBuilderMethods.at};/**
     * {@linkcode bitbucket/util/navbuilder.Builder} for REST repository files list URLs.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class RestRepoFilesListBuilder
     * @extends bitbucket/util/navbuilder.RestRepoFilesListAtBuilder
     * @memberof bitbucket/util/navbuilder
     */var restRepoFilesListBuilderMethods=/**
         * @lends bitbucket/util/navbuilder.RestRepoFilesListBuilder.prototype
         */{/**
             * @param {...string} component - A path component within which to obtain a list of files.
             * @returns {bitbucket/util/navbuilder.RestRepoFilesListAtBuilder}
             */path:function restRepoFilesInPath(){var path=this._path();return path.pushComponents.apply(path,componentsFromArguments(arguments)).makeBuilder(restRepoFilesListAtBuilderMethods);},at:restRepoFilesListAtBuilderMethods.at};/**
     * Documented at parent builder
     * @private
     */function restRepoFind(){return this._path().pushComponents('files').makeBuilder(restRepoFilesListBuilderMethods);}/**
     * {@linkcode bitbucket/util/navbuilder.Builder} for REST project permissions URLs.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class RestProjectPermissionsBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * Documented at parent builder
     * @private
     */function restProjPermissions(){return this._path().pushComponents('permissions').makeBuilder(/**
         * @lends bitbucket/util/navbuilder.RestProjectPermissionsBuilder.prototype
         */{/**
             * {@linkcode bitbucket/util/navbuilder.Builder} for REST project read permissions URLs.
             *
             * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
             *
             * @class RestProjectReadPermissionsBuilder
             * @memberof bitbucket/util/navbuilder
             *//**
             * @returns {bitbucket/util/navbuilder.RestProjectReadPermissionsBuilder}
             */projectRead:function restProjReadPerms(){return this._path().pushComponents('project-read').makeBuilder(/**
                 * @lends bitbucket/util/navbuilder.RestProjectReadPermissionsBuilder.prototype
                 */{/**
                     * @method
                     * @returns {bitbucket/util/navbuilder.RestPermissionAllowBuilder}
                     */all:restAllProjPerms,/**
                     * @returns {bitbucket/util/navbuilder.RestPermissionAllowBuilder}
                     */anon:function restAnonProReadPerms(){return this._path().pushComponents('anon').makeBuilder(allowBuilderMethods);}});},/**
             * {@linkcode bitbucket/util/navbuilder.Builder} for REST project read permissions URLs.
             *
             * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
             *
             * @class RestProjectWritePermissionsBuilder
             * @memberof bitbucket/util/navbuilder
             *//**
             * @returns {bitbucket/util/navbuilder.RestProjectWritePermissionsBuilder}
             */projectWrite:function restProjWritePerms(){return this._path().pushComponents('project-write').makeBuilder(/**
                 * @lends bitbucket/util/navbuilder.RestProjectWritePermissionsBuilder.prototype
                 */{/**
                     * @method
                     * @returns {bitbucket/util/navbuilder.RestPermissionAllowBuilder}
                     */all:restAllProjPerms});}});}/**
     * {@linkcode bitbucket/util/navbuilder.Builder} to grant permissions.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class RestPermissionAllowBuilder
     * @memberof bitbucket/util/navbuilder
     */var allowBuilderMethods=/**
     * @lends bitbucket/util/navbuilder.RestPermissionAllowBuilder.prototype
     */{/**
         * @method
         * @returns {bitbucket/util/navbuilder.Builder}
         */allow:restAllowProjPerms};/**
     * Documented at parent builders
     * @private
     */function restAllProjPerms(){return this._path().pushComponents('all').makeBuilder(allowBuilderMethods);}/**
     * Documented at parent builders
     * @private
     */function restAllowProjPerms(allow){return this._path().addParams({'allow':allow}).makeBuilder();}/**
     * {@linkcode bitbucket/util/navbuilder.Builder} for info about repository hook plugins.
     *
     * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
     *
     * @class RestHookPluginsBuilder
     * @memberof bitbucket/util/navbuilder
     *//**
     * Documented at parent builders
     * @private
     */function restHookPlugins(){return this._path().pushComponents('hooks').makeBuilder(/**
         * @lends bitbucket/util/navbuilder.RestHookPluginsBuilder.prototype
         */{/**
             * {@linkcode bitbucket/util/navbuilder.Builder} for info about a repository hook plugin.
             *
             * NOTE: The constructor is not exposed. A new instance can be created through the Builder API.
             *
             * @class RestHookPluginBuilder
             * @memberof bitbucket/util/navbuilder
             *//**
             * @param {string} hookKey - The key of the hook.
             * @returns {bitbucket/util/navbuilder.RestHookPluginBuilder}
             */hook:function restHookPlugin(hookKey){return this._path().pushComponents(hookKey).makeBuilder(/**
                 * @lends bitbucket/util/navbuilder.RestHookPluginBuilder.prototype
                 */{/**
                     * @param {string} [version] - A string identifying the version of the hook plugin.
                     *                             Used only to invalidate browser caches when the plugin updates.
                     * @returns {bitbucket/util/navbuilder.Builder}
                     */avatar:function restHookAvatar(version){return this._path().pushComponents('avatar').addParams({'version':version}).makeBuilder();}});}});}/**
     * Documented at parent builders.
     * @private
     */function userAvatar(size){var builder=this._path().pushComponents('avatar.png');if(size){builder=builder.addParams({s:size});}return builder.makeBuilder();}// HACKY CODE CHECK: off
var fallbackUrlPattern=/(default-avatar-)\d+(\.png)/;/**
     * @private
     */function _avatarUrl(person,size){return{build:function build(){var uri=_parse(person.avatarUrl);if(uri.getQueryParamValue("s")){uri.replaceQueryParam("s",size);}// If what we're looking at is the default avatar, its size is set differently,
// so use a regex in the filename, rather than a query string param, to insert the correct size.
return uri.toString().replace(fallbackUrlPattern,"$1"+size+"$2");}};}// HACKY CODE CHECK: on
/**
     * An object representation of a URI with methods allowing you to read and modify the URI.
     *
     * NOTE: The Uri constructor is not exposed. Use {@linkcode bitbucket/util/navbuilder.parse} to create an instance.
     *
     * @class Uri
     * @memberof bitbucket/util/navbuilder
     *//**
     * Serialize the Uri instance.
     *
     * @function toString
     * @name bitbucket/util/navbuilder.Uri#toString
     * @returns {string}
     *//**
     * Get just the path portion of the URI.
     *
     * @function path
     * @name bitbucket/util/navbuilder.Uri#path
     * @returns {string}
     *//**
     * Get just the query string portion of the URI, as an object.
     *
     * @function query
     * @name bitbucket/util/navbuilder.Uri#query
     * @returns {bitbucket/util/navbuilder.Query}
     *//**
     * Get just the anchor/hash portion of the URI.
     *
     * @function anchor
     * @name bitbucket/util/navbuilder.Uri#anchor
     * @returns {string}
     *//**
     * Add a query parameter value. If the key is already present in the URI, the key will be repeated.
     *
     * @function addQueryParam
     * @name bitbucket/util/navbuilder.Uri#addQueryParam
     * @param {string} paramKey - The key/name of the parameter.
     * @param {string} paramValue - The value for the parameter.
     * @returns {bitbucket/util/navbuilder.Uri}
     *//**
     * Add a query parameter value. If the key is already present in the URI, it will be replaced.
     *
     * @function replaceQueryParam
     * @name bitbucket/util/navbuilder.Uri#replaceQueryParam
     * @param {string} paramKey - The key/name of the parameter.
     * @param {string} paramValue - The value for the parameter.
     * @returns {bitbucket/util/navbuilder.Uri}
     *//**
     * Remove a query parameter from the URI.
     *
     * @function deleteQueryParam
     * @name bitbucket/util/navbuilder.Uri#deleteQueryParam
     * @param {string} paramKey - The key/name of the parameter.
     * @returns {bitbucket/util/navbuilder.Uri}
     *//**
     * Get a query parameter value. If the key is repeated in the URI, the first instance will be returned.
     *
     * @function getQueryParamValue
     * @name bitbucket/util/navbuilder.Uri#getQueryParamValue
     * @param {string} paramKey - The key/name of the parameter.
     * @returns {string}
     *//**
     * Get an array of query parameter values for a key.
     *
     * @function getQueryParamValues
     * @name bitbucket/util/navbuilder.Uri#getQueryParamValues
     * @param {string} paramKey - The key/name of the parameter.
     * @returns {Array<string>}
     *//**
     * Parse an absolute string URI in to a mutable Uri object.
     * @memberof bitbucket/util/navbuilder
     * @param {string} uri - An absolute URI to be parsed.
     * @returns {bitbucket/util/navbuilder.Uri}
     */function _parse(uri){return new Uri(uri);}/**
     * An object representation of a query string with methods allowing you to read and modify the string.
     *
     * NOTE: The Query constructor is not exposed. Use {@linkcode bitbucket/util/navbuilder.parseQuery} to create an instance.
     *
     * @class Query
     * @memberof bitbucket/util/navbuilder
     *//**
     * Serialize the Query instance.
     *
     * @function toString
     * @name bitbucket/util/navbuilder.Query#toString
     * @returns {string}
     *//**
     * Add a query parameter value. If the key is already present in the Query, the key will be repeated.
     *
     * @function addParam
     * @name bitbucket/util/navbuilder.Query#addParam
     * @param {string} paramKey - The key/name of the parameter.
     * @param {string} paramValue - The value for the parameter.
     * @returns {bitbucket/util/navbuilder.Query}
     *//**
     * Add a query parameter value. If the key is already present in the Query, it will be replaced.
     *
     * @function replaceParam
     * @name bitbucket/util/navbuilder.Query#replaceParam
     * @param {string} paramKey - The key/name of the parameter.
     * @param {string} paramValue - The value for the parameter.
     * @returns {bitbucket/util/navbuilder.Query}
     *//**
     * Remove a query parameter from the URI.
     *
     * @function deleteParam
     * @name bitbucket/util/navbuilder.Query#deleteParam
     * @param {string} paramKey - The key/name of the parameter.
     * @returns {bitbucket/util/navbuilder.Query}
     *//**
     * Get a query parameter value. If the key is repeated in the Query, the first instance will be returned.
     *
     * @function getParamValue
     * @name bitbucket/util/navbuilder.Query#getParamValue
     * @param {string} paramKey - The key/name of the parameter.
     * @returns {string}
     *//**
     * Get an array of query parameter values for a key.
     *
     * @function getParamValues
     * @name bitbucket/util/navbuilder.Query#getParamValues
     * @param {string} paramKey - The key/name of the parameter.
     * @returns {Array<string>}
     *//**
     * Parse a URI's query string into a mutable object.
     * @memberof bitbucket/util/navbuilder
     * @param {string} queryString - A query string to be parsed.
     * @returns {bitbucket/util/navbuilder.Query}
     */function parseQuery(queryString){/* global Query: false */return new Query(queryString);}/**
     * Get a raw builder instance to form your own URLs.
     *
     * @memberof bitbucket/util/navbuilder
     * @param {Array<string>} components - An array of path components that will be URI encoded and joined by forward slashes when the URL is formed.
     * @param {Object} params - A map of parameter names to values that will form the query string.
     * @returns {bitbucket/util/navbuilder.Builder}
     */function newBuilder(components,params){return new PathAndQuery(components,params).makeBuilder();}exports._avatarUrl=_avatarUrl;exports.addons=addons;exports.admin=admin;exports.allProjects=allProjects;exports.allRepos=globalAllRepos;exports.captcha=captcha;exports.createProject=createProject;exports.currentProject=currentProject;exports.currentPullRequest=currentPullRequest;exports.currentRepo=currentRepo;exports.login=login;exports.newBuilder=newBuilder;exports.parse=_parse;exports.parseQuery=parseQuery;exports.pluginServlets=pluginServlets;exports.project=project;exports.rest=rest;exports.search=search;exports.tmp=tmp;exports.user=user;exports.welcome=welcome;exports.gettingStarted=gettingStarted;});