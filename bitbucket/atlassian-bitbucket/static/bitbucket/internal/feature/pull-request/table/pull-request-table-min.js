define("bitbucket/internal/feature/pull-request/pull-request-table","aui aui/flag jquery lodash bitbucket/internal/model/page-state bitbucket/internal/model/pull-request bitbucket/internal/util/events bitbucket/internal/widget/paged-table".split(" "),function(f,q,g,p,h,r,l,k){function c(d,e,b,a){this.prState=d&&d.toUpperCase();this.prOrder=e?e:this.prState===r.state.OPEN?"oldest":"newest";this.getPullRequestsUrlBuilder=b;this.prDirection=a.direction;this.prSource=a.source;d={noneFoundMessageHtml:bitbucket.internal.feature.pullRequest.pullRequestTableEmpty({state:this.prState})};
a=g.extend(c.defaults,d,a);this.alwaysDisplayRepositories=a.alwaysDisplayRepositories;this.hideAuthorName=a.hideAuthorName;this.scope=a.scope;this.showStatus=a.showStatus;a.initialData&&g(a.container).replaceWith(bitbucket.internal.feature.pullRequest.pullRequestTable({pullRequestPage:a.initialData,alwaysDisplayRepositories:a.alwaysDisplayRepositories,currentUser:h.getCurrentUser().toJSON()}));k.call(this,a);g(this.options.target).find(".author \x3e div, .author .aui-avatar-inner \x3e img").tooltip({hoverable:!1,
offset:5,delayIn:0,gravity:function(){return g.fn.tipsy.autoNS.call(this)+g.fn.tipsy.autoWE.call(this)},live:!0})}c.defaults={allFetchedMessageHtml:'\x3cp class\x3d"no-more-results"\x3e'+f.I18n.getText("bitbucket.web.pullrequest.allfetched")+"\x3c/p\x3e",alwaysDisplayRepositories:!1,bufferPixels:150,hideAuthorName:!1,scope:"repository",showStatus:!1,target:"#pull-requests-table",container:"#pull-requests-table-container",tableMessageClass:"pull-request-table-message",paginationContext:"pull-request-table",
pageSize:25};g.extend(c.prototype,k.prototype);c.prototype.buildUrl=function(d,e){var b=this.getPullRequestsUrlBuilder().withParams({start:d,limit:e,avatarSize:bitbucket.internal.widget.avatarSizeInPx({size:"medium"}),withAttributes:!0});this.prDirection&&(b=b.withParams({direction:this.prDirection}));this.prSource&&(b=b.withParams({at:this.prSource}));this.prState&&(b=b.withParams({state:this.prState}));this.prOrder&&(b=b.withParams({order:this.prOrder}));return b.build()};c.prototype.focusInitialRow=
function(){this.$table.find("tbody tr.pull-request-row:first").addClass("focused")};c.prototype.attachNewContent=function(d,e){k.prototype.attachNewContent.call(this,d,e);l.trigger("bitbucket.internal.feature.pullRequestsTable.contentAdded",this,d)};c.prototype.handleNewRows=function(d,e){var b=this,a=g(p.map(d.values,function(a){return bitbucket.internal.feature.pullRequest.pullRequestRow({alwaysDisplayRepositories:b.alwaysDisplayRepositories,currentUser:h.getCurrentUser().toJSON(),hideAuthorName:b.hideAuthorName,
pullRequest:a,scope:b.scope,showStatus:b.showStatus})}).join(""));this.$table.show().children("tbody")["html"!==e?e:"append"](a)};c.prototype.initShortcuts=function(){function d(b){var a=[{name:"filter-current-user",description:f.I18n.getText("bitbucket.web.pullrequest.filter-current-user")},{name:"filter-current-user-unactioned",description:f.I18n.getText("bitbucket.web.pullrequest.filter-current-user-unactioned")},{name:"",description:f.I18n.getText("bitbucket.web.pullrequest.filter-all")}],c=a.length-
1;p.any(a,function(d,e){if(b.hasClass(d.name)||e===c){var f=e<c?a[e+1]:a[0];b.removeClass(d.name).addClass(f.name);m&&m.close();m=q({type:"info",title:f.description,close:"auto"});return!0}return!1})}var e=this,b=this.$table.selector,a=!1,c={focusedClass:"focused",wrapAround:!1,escToCancel:!1},h=b+" .pull-request-row."+c.focusedClass,n=h+", "+b+":not(.filter-current-user, .filter-current-user-unactioned) .pull-request-row, "+b+".filter-current-user .pull-request-row.current-user, "+b+".filter-current-user-unactioned .pull-request-row.current-user:not(.current-user-actioned)";
l.on("bitbucket.internal.keyboard.shortcuts.disableOpenItemHandler",function(){a=!0});l.on("bitbucket.internal.keyboard.shortcuts.enableOpenItemHandler",function(){a=!1});this.bindMoveToNextHandler=function(a){(this.moveToNextItem?this:f.whenIType(a)).moveToNextItem(n,c).execute(function(){g(n).last().hasClass(c.focusedClass)&&window.scrollTo(0,document.documentElement.scrollHeight)})};this.bindMoveToPreviousHandler=function(a){(this.moveToPrevItem?this:f.whenIType(a)).moveToPrevItem(n,c)};this.bindOpenItemHandler=
function(b){(this.execute?this:f.whenIType(b)).execute(function(){if(!a){var b=jQuery(h);b.length&&(window.location.href=b.find("td.id a").attr("href"))}})};this.bindHighlightAssignedHandler=function(a){(this.execute?this:f.whenIType(a)).execute(function(){d(e.$table)})};var m;k.prototype.initShortcuts.call(this)};return c});