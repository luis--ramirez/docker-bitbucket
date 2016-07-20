define("bitbucket/internal/feature/file-content/commit-selector","aui jquery lodash bitbucket/util/navbuilder bitbucket/internal/model/path bitbucket/internal/util/ajax bitbucket/internal/util/events bitbucket/internal/widget/keyboard-controller bitbucket/internal/widget/paged-scrollable".split(" "),function(l,f,u,h,q,k,r,v,w){function c(a){var b=this,d=a.id,g=this._$selectorButton=f(a.buttonEl);this._$selectorButtonText=g.find(".aui-button-label");this._id=d;this._scrollPaneSelector="#inline-dialog-"+
d+" .commit-selector";this._listSelector=this._scrollPaneSelector+" \x3e ul";this._scrollable=null;var e=this,c=!1,m,n=function(a){a.keyCode===l.keyCode.ESCAPE&&(e.hide(),a.preventDefault())},p=function(a){e.isButtonEnabled()&&e.show();a.preventDefault()},h=function(a){e.hide();a.preventDefault()},k=this._itemClicked=function(a){e.hide();var b=f(this),d=b.children("a").attr("data-id"),d=e._visibleCommits[d],g=null,c=null;d&&d.properties&&d.properties.change&&(g=d.properties.change.path?new q(d.properties.change.path):
null,c=d.properties.change.srcPath?new q(d.properties.change.srcPath):null);f("li",e._listSelector).removeClass("selected");b.addClass("selected");e._renderButton(d);r.trigger("bitbucket.internal.feature.commitselector.commitSelected",e,d,e._pullRequest,g,c);a.preventDefault()},t=function(){return b.hide()};this.resetDialog=function(){b.hide();b._scrollable&&b._scrollable.reset();f(document).off("keyup",n);m&&m.off("click","li.commit-list-item",k);c=!1};this._inlineDialog=l.InlineDialog(g,d,function(a,
d,b){c?b():(c=!0,m=a.html(bitbucket.internal.feature.fileContent.commitSelector()),m.on("click","li.commit-list-item",k),b(),e._scrollable=e._createScrollable(),e._visibleCommits={},setTimeout(function(){a.find(".spinner-container").spin();e._scrollable.init()},0),e._initialiseKeyboardNavigation(),e._initialiseMouseNavigation());g.off("click",p);g.on("click",h);f(document).on("keyup",n);f(window).on("scroll",t)},{hideDelay:null,width:483,noBind:!0,hideCallback:function(){f(window).off("scroll",t);
f(document).off("keyup",n);g.off("click",h);g.on("click",p);f(document.activeElement).closest(e._scrollPaneSelector).length&&document.activeElement.blur()}});g.on("click",p);this._events=r.chain().on("bitbucket.internal.feature.commitselector.commitSelected",e.hide).on("bitbucket.internal.page.*.revisionRefChanged",this.resetDialog).on("bitbucket.internal.page.*.pathChanged",this.resetDialog)}function x(a,b){u.forEach(a,function(a){b[a.id]=a})}var y=v.ListKeyboardController;c.prototype.init=function(a){this._followRenames=
a.followRenames;this._headRevisionRef=a.headRevisionReference;this._itemTemplate=a.itemTemplate;this._itemTitle=a.itemTitle;this._itemUrl=a.itemUrl;this._mode=a.mode;this._path=a.path;this._preloadItems=a.preloadItems;this._pullRequest=a.pullRequest;this._selectedCommit=a.selectedCommit;this._updateButton=a.updateButton;this._lastPageMessage=a.lastPageMessage||l.I18n.getText("bitbucket.web.file.history.allhistoryfetched");this._renderButton(a.selectedCommit)};c.prototype.destroy=function(){this.resetDialog();
this._events.destroy();this._inlineDialog.remove();this._resultsKeyboardController&&(this._resultsKeyboardController.destroy(),this._resultsKeyboardController=null)};c.prototype.show=function(){this._inlineDialog.show()};c.prototype.hide=function(){this._inlineDialog.hide()};c.prototype._createScrollable=function(){var a=new w(this._scrollPaneSelector,{bufferPixels:0,pageSize:25,paginationContext:"file-history",preventOverscroll:!0});a.requestData=this.requestData.bind(this);a.attachNewContent=this.attachNewContent.bind(this);
var b=a.onFirstDataLoaded;a.onFirstDataLoaded=function(){return b.apply(this,arguments)};return a};c.prototype.requestData=function(a,b){this._inlineDialog.find(".spinner-container").spin();var d;d=this._pullRequest?h.rest().currentRepo().pullRequest(this._pullRequest.id).commits().withParams({start:a,limit:b,avatarSize:bitbucket.internal.widget.avatarSizeInPx({size:"xsmall"})}):h.rest().currentRepo().commits().withParams({followRenames:this._followRenames,path:this._path.toString(),until:this._headRevisionRef.getId(),
start:a,limit:b,avatarSize:bitbucket.internal.widget.avatarSizeInPx({size:"xsmall"})});return k.rest({url:d.build()}).done(function(a){return 0<a.size?a:k.rest({url:d.withParams({followRenames:!1}).build()})})};c.prototype.attachNewContent=function(a){x(a.values,this._visibleCommits);var b=this,d=this._selectedCommit&&this._selectedCommit.id,c=a.values.map(function(c){return bitbucket.internal.widget.commit.commitListItem({isSelected:d===c.id,content:b._itemTemplate({commit:c,href:b._itemUrl(c,b)}),
title:b._itemTitle?b._itemTitle(c.displayId):"",isFocused:d===c.id&&0===a.start})}),e=this._preloadItems&&0===a.start?this._preloadItems.map(function(a){return bitbucket.internal.widget.commit.commitListItem({isSelected:a.selected,content:a.content,title:a.title||""})}):null,h=f(this._listSelector);h.append(e).append(c);c=f(this._scrollPaneSelector).children(".spinner-container");c.spinStop();a.isLastPage&&(h.append(bitbucket.internal.feature.fileContent.commitSelectorNoMoreResults({lastPageMessage:this._lastPageMessage})),
c.remove())};c.prototype.isButtonEnabled=function(){return!this._$selectorButton.prop("disabled")};c.prototype._initialiseKeyboardNavigation=function(){var a=this,b=f(a._scrollPaneSelector);a._resultsKeyboardController&&a._resultsKeyboardController.destroy();a._resultsKeyboardController=new y(a._$selectorButton,a._listSelector,{focusedClass:"focused",itemSelector:"li.commit-list-item",adjacentItems:!0,requestMore:function(){var b=a._scrollable.loadAfter();return b&&b.then(function(a){return a.isLastPage})},
onSelect:function(b){a._inlineDialog.is(":visible")?b.click():a._$selectorButton.click()},onFocusLastItem:function(){b.scrollTop(b[0].scrollHeight)}})};c.prototype._initialiseMouseNavigation=function(){var a=f(this._listSelector);a.on("mouseenter","li",function(b){b=f(b.currentTarget);b.find(".focused").length||(a.find(".focused").removeClass("focused"),b.addClass("focused"))})};c.prototype._renderButton=function(a){this._updateButton&&(this._$selectorButton.children(".commit-icon").replaceWith(bitbucket.internal.feature.fileContent.commitSelectorItemIcon({commit:a})),
this._$selectorButtonText.text(a?a.message:l.I18n.getText("bitbucket.web.diff.all.changes.displayed")))};return c});