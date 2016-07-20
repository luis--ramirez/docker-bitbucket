define("bitbucket/internal/feature/file-content/text-view/request-window-scrolls","bacon jquery lodash bitbucket/internal/util/bacon bitbucket/internal/util/performance bitbucket/internal/util/region-scroll-forwarder bitbucket/internal/util/request-page-scrolling bitbucket/internal/util/scroll".split(" "),function(g,p,q,h,r,t,e,u){return function(b,c){return e().done(function(f){var k=new g.Bus,a=b._$container.addClass("full-window-scrolling"),e=a.closest(".file-content"),l,v=u.fakeScroll(a[0]),a=
g.mergeAll(["bitbucket.internal.feature.sidebar.expandEnd","bitbucket.internal.feature.sidebar.collapseEnd","bitbucket.internal.feature.commit.difftree.collapseAnimationFinished","bitbucket.internal.layout.body.resize"].map(h.events).concat(h.getWindowSizeProperty().toEventStream())).toProperty();b._addDestroyable(f);b._addDestroyable(a.scan(0,function(b,a){return a&&a.hasOwnProperty("width")&&a.hasOwnProperty("height")&&a||b}).filter(q.identity).onValue(function(a){l=a.height-b._$fileToolbar.outerHeight();
c.resize(b._$container.width(),l)}));a=r.enqueueCapped(b._whenOpDone.bind(b),function(){b._$container&&f.refresh()});c.onSizeChange(a);b.on("widgetAdded",a);b.on("widgetChanged",a);b.on("widgetCleared",a);b.on("internal-change",a);if(b._options.commentContext)b._options.commentContext.on("fileCommentsResized",a);a=new t(k,[{id:"file-comments-and-messages",getHeight:function(){return b._editorInnerOffset()||0},setScrollTop:function(a){v(0,a)}},{id:"editors",getHeight:function(){return Infinity},setScrollTop:function(a){c.scroll(null,
a)}}]);b._addDestroyable(a);if(b._options.commentContext)b._options.commentContext.on("fileCommentsResized",a.heightsChanged.bind(a));f.setTarget({scrollSizing:function(){var a=c.scrollSizing();return{height:a.height+b._editorInnerOffset(),clientHeight:a.clientHeight}},offset:function(){return e.offset()},scroll:function(a,b){null!=b&&k.push({top:b})}});var a=/Chrome\//.test(window.navigator.userAgent),m=/Apple Computer/.test(window.navigator.vendor),d=1;a?d=-.7:m&&(d=-1/3);var n=p(window);(a||m)&&
b._$container[0].addEventListener("mousewheel",function(a){if(a.wheelDeltaX&&a.wheelDeltaY){if(Math.abs(a.wheelDeltaX)>Math.abs(a.wheelDeltaY)){var b=c.scrollSizing();c.scroll(b.left-a.wheelDeltaX*d,null)}else n.scrollTop(n.scrollTop()+a.wheelDeltaY*d);a.stopImmediatePropagation();a.preventDefault()}},!0)})}});