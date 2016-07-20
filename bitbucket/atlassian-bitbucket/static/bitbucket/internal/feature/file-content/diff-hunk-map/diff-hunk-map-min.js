define("bitbucket/internal/feature/file-content/diff-hunk-map",["jquery","lodash","bitbucket/internal/util/function","bitbucket/internal/util/math","bitbucket/internal/util/scroll"],function(c,f,h,d,k){function a(b,g,a){this.init.apply(this,arguments)}var e={CONTEXT:"#ffffff",ADDED:"#97f295",REMOVED:"#ffb6ba",CONFLICT:"#FFF986"};a.prototype.init=function(b,g,a){this.regions=g;this.options=c.extend({},a);this.$hunkMap=c(bitbucket.internal.feature.fileContent.diffHunkMap()).appendTo(b);this.hunkMapWidth=
this.$hunkMap.width();this.$indicator=c(bitbucket.internal.feature.fileContent.diffHunkMapViewportIndicator()).appendTo(this.$hunkMap);this.indicatorScroll=k.fakeScroll(this.$indicator[0],{withDocument:!0});this.addCanvas(d.Size(this.hunkMapWidth,this.$hunkMap.height()));this.redraw();if("function"===typeof this.options.scrollToFn)this.$hunkMap.on("click",this._hunkMapClicked.bind(this,this.options.scrollToFn))};a.prototype.setIndicator=function(){var b=this.hunkMapHeight/this.totalHeight*this.hunkMapHeight,
a=0===this.hunkMapHeight||b===this.hunkMapHeight;this.$indicator.toggleClass("hidden",a);a||this.$indicator.height(b)};a.prototype.diffScrolled=function(b){this.indicatorScroll(0,b.top/b.height*this.hunkMapHeight)};a.prototype._hunkMapClicked=function(b,a){var l=a.pageY-this.$hunkMap.offset().top;b(l/this.hunkMapHeight)};a.prototype.mapHeights=function(){var b=f.invoke(this.regions,"getHeight"),a=this;this.totalHeight=b.reduce(d.add,0);this.hunkMapHeight=Math.min(this.$hunkMap.height(),this.totalHeight);
f.chain(this.regions).zip(b).forEach(h.spread(function(b,c){b.fraction=c/a.totalHeight})).value()};a.prototype.addHunkToMap=function(b,a){if(0===a.fraction)return b;var c=this.getHunkHeight(a);this.setFillStyle(a._seg.lines[0].conflictMarker?e.CONFLICT:e[a._seg.type]||e.CONTEXT);this.drawHunk(d.Point(0,b),d.Size(this.hunkMapWidth,c));return b+c};a.prototype.getHunkHeight=function(a){return Math.max(a.fraction*this.hunkMapHeight,1)};a.prototype.clear=function(){this.canvasContext.clearRect(0,0,this.hunkMapWidth,
this.hunkMapHeight)};a.prototype.draw=function(){this.$canvas.attr("height",this.hunkMapHeight);this.regions.reduce(this.addHunkToMap.bind(this),0);this.setIndicator()};a.prototype.redraw=function(){this.clear();this.mapHeights();this.draw()};a.prototype.addCanvas=function(a){this.$canvas=c(bitbucket.internal.feature.fileContent.diffHunkMapCanvas({size:a})).appendTo(this.$hunkMap);this.canvasContext=this.$canvas[0].getContext("2d")};a.prototype.setFillStyle=function(a){this.canvasContext.fillStyle=
a};a.prototype.drawHunk=function(a,c){this.canvasContext.fillRect(a.x,a.y,c.width,c.height)};a.prototype.destroy=function(){this.$hunkMap.remove()};return a});