define("bitbucket/internal/widget/webcam-capture","aui jquery lodash bitbucket/internal/feature/moustash bitbucket/internal/util/feature-detect bitbucket/internal/util/user-media".split(" "),function(g,d,h,k,l,m){function a(b,c){h.bindAll(this,"start","_setVideoSize","_capture","_takePhoto","_onKeypress","_onTakePhotoClicked","_onUserMediaSuccess","_onUserMediaError");this.opts=h.extend({},a.defaults,c);this.$container=b;this.video=b.find("video")[0];this.$takePhoto=b.find(".take-photo");this.$countdown=
b.find(".countdown");this.$videoPlaceholder=b.find(".video-placeholder");this.width=this.opts.width;this.snapSound=new Audio;d(this.video).toggleClass("mirror",this.opts.mirror).on("canplay",this._setVideoSize);this.$takePhoto.on("click",this._onTakePhotoClicked).tooltip({gravity:"w",fade:!0});this.$container.find(".retry-webcam").on("click",function(){this.$container.find(".no-access").addClass("hidden");this.$container.find(".grant-access").removeClass("hidden");setTimeout(this.start,50);return!1}.bind(this))}
a.isSupported=h.once(function(){return l.getUserMedia()&&l.canvas()&&l.video()});a.defaults={countdown:!1,mirror:!0,width:640,onCapture:d.noop};a.prototype.start=function(){this.snapSound.src=g.contextPath()+"/s/1/_/download/resources/com.atlassian.bitbucket.server.bitbucket-web:webcam-capture/camera-snap.wav";this.stream?(this.video.play(),this.isStreaming=!0,this.$takePhoto.focus()):m({video:!0,audio:!1},this._onUserMediaSuccess,this._onUserMediaError)};a.prototype.pause=function(){this.isStreaming&&
(this.video.pause(),this.isStreaming=!1)};a.prototype.stop=function(){this.stream&&(this.pause(),this.video.src=null,this.stream.stop(),this.stream=null,d(document).off("keypress",this._onKeypress));this.$takePhoto.tipsy("hide");this.$container.removeClass("streaming")};a.prototype._onUserMediaSuccess=function(b){this.stream=b;this.video.src=window.URL.createObjectURL(b);this.video.play();this.isStreaming=!0;k.loadResources();this.$container.addClass("streaming");this.$takePhoto.focus();d(document).on("keypress",
this._onKeypress)};a.prototype._onUserMediaError=function(){this.$videoPlaceholder.find(".no-access").removeClass("hidden");this.$videoPlaceholder.find(".grant-access").addClass("hidden")};a.prototype._onKeypress=function(b){"m"===String.fromCharCode(b.which).toLowerCase()&&this._takePhoto(!0)};a.prototype._onTakePhotoClicked=function(){this._takePhoto(!1)};a.prototype._takePhoto=function(b){var c=this;this.isStreaming&&!this.$takePhoto.is(":disabled")&&(this.opts.countdown?(this.$takePhoto.prop("disabled",
!0),this._doCountdown().always(function(){c.$takePhoto.prop("disabled",!1);c.$countdown.addClass("hidden")}).done(function(){c._capture(b)})):this._capture(b))};a.prototype._setVideoSize=function(){this.height=this.video.videoWidth?this.video.videoHeight/(this.video.videoWidth/this.width):.75*this.width;this.video.setAttribute("width",this.width);this.video.setAttribute("height",this.height)};a.prototype._doCountdown=function(){function b(){c.isStreaming?a?(c.$countdown.text(a--),setTimeout(b,1E3)):
e.resolve():e.reject()}var c=this,a=3,e=d.Deferred();this.$countdown.removeClass("hidden");b();return e};a.prototype._capture=function(b){this._setVideoSize();var a=d("\x3ccanvas/\x3e").attr("width",this.width).attr("height",this.height)[0],f=a.getContext("2d");this.snapSound.play();var e=d('\x3cdiv class\x3d"flasher"/\x3e');g.LayerManager.global.push(e);e.on("animationend webkitAnimationEnd MSAnimationEnd oanimationend",function(){g.LayerManager.global.popUntil(e);e.remove()}).appendTo("body");f.drawImage(this.video,
0,0,this.width,this.height);b&&k.isReady()&&k.addToFaces(a);this.opts.mirror&&(a=this._mirrorCanvas(a));b=a.toDataURL("image/png");this.opts.onCapture(b);this.$takePhoto.tipsy("hide")};a.prototype._mirrorCanvas=function(a){var c=d("\x3ccanvas/\x3e").attr("width",this.width).attr("height",this.height)[0],f=c.getContext("2d");f.translate(this.width,0);f.scale(-1,1);f.drawImage(a,0,0);return c};return a});