define("bitbucket/internal/widget/avatar-picker-dialog","aui jquery lodash bitbucket/util/navbuilder bitbucket/internal/util/text bitbucket/internal/widget/image-upload-and-crop".split(" "),function(c,e,h,k,l,f){function a(b){if(!a.isSupported())throw Error("This browser doesn't support AvatarPickerDialog.");return this.init(b)}a.isSupported=function(){return f.isSupported()};a.maskShapes=f.maskShapes;a.prototype.defaults={dialogTitle:c.I18n.getText("bitbucket.web.avatar.picker.title"),dialogId:"avatar-picker-dialog",
dialogDoneButtonText:c.I18n.getText("bitbucket.web.button.done"),imageSrc:null,maskShape:null,fallbackDescription:c.I18n.getText("bitbucket.web.avatar.picker.instructions.fallback"),onCrop:e.noop,trigger:null};a.prototype.init=function(a){h.bindAll(this,"initDialog","_enableDoneButton","_disableDoneButton","_toggleDoneButtonEnabled","chooseAvatar","hide","show");this.options=e.extend(!0,{},this.defaults,a);this.initDialog();this._toggleDoneButtonEnabled(!1);this.imageUploadAndCrop=new f(this.dialog.$el.find(".image-upload-and-crop-container"),
{HiDPIMultiplier:1,onCrop:this.options.onCrop,onImageUpload:this._enableDoneButton,onImageUploadError:this._disableDoneButton,onImageClear:this._disableDoneButton,fallbackUploadOptions:{uploadURL:k.tmp().avatars().build(),uploadFieldName:"avatar",responseHandler:function(a,b){var d=e(a),c=d.find("#json-response");if(c.length){var g;try{g=JSON.parse(c.html())}catch(f){b.reject()}g&&g.url?b.resolve(g.url):b.reject()}else d=d.find(".error-image + h2").text(),d=d.replace(/; nested exception.*$/,".").replace(/(\d+) bytes/,
function(a,b){return l.formatSizeInBytes(b)}),b.reject(d)},cancelTrigger:this.$doneButton.add(this.$cancelButton),xsrfToken:this.options.xsrfToken}});this.options.trigger&&(this.$trigger=e(this.options.trigger),this.$trigger.click(h.bind(function(a){a.preventDefault();this.show()},this)));return this};a.prototype.initDialog=function(){this.dialog=c.dialog2(bitbucket.internal.widget.avatarPickerDialog({id:this.options.dialogId,title:this.options.dialogTitle,doneButtonText:this.options.dialogDoneButtonText,
imageSrc:this.options.imageSrc,maskShape:this.options.maskShape,fallbackDescription:this.options.fallbackDescription,enableWebcam:this.options.enableWebcam}));this.dialog.$el.appendTo("body");this.$doneButton=this.dialog.$el.find(".avatar-picker-save").on("click",this.chooseAvatar);this.$cancelButton=this.dialog.$el.find(".avatar-picker-cancel").on("click",this.hide)};a.prototype._enableDoneButton=function(){this._toggleDoneButtonEnabled(!0)};a.prototype._disableDoneButton=function(){this._toggleDoneButtonEnabled(!1)};
a.prototype._toggleDoneButtonEnabled=function(a){null==a&&(a=null!=this.$doneButton.attr("disabled"));a?this.$doneButton.removeAttr("disabled"):this.$doneButton.attr("disabled","disabled")};a.prototype.chooseAvatar=function(){this.imageUploadAndCrop.crop();this.hide()};a.prototype.hide=function(){this.dialog.hide();this.imageUploadAndCrop.resetState()};a.prototype.show=function(){this.dialog.show()};return a});