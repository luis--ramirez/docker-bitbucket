define("bitbucket/internal/page/pull-request/pull-request-view",["aui","aui/flag","bitbucket/internal/layout/pull-request","bitbucket/internal/model/page-state","exports"],function(b,c,d,e,a){a.registerHandler=d.registerHandler;a.onReady=function(a){a&&c({type:"success",title:b.I18n.getText("bitbucket.web.pullrequest.unwatched.header",e.getPullRequest().getId()),close:"auto",body:b.I18n.getText("bitbucket.web.pullrequest.unwatched.content")})}});