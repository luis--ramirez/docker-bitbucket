define("bitbucket/internal/widget/drag-drop-file-target",["jquery","lodash","bitbucket/internal/util/events"],function(c,d,e){function b(a,b){return this.init.apply(this,arguments)}b.prototype.getDefaults=function(){return{activeDropTargetClass:"active-drop-target",uploadPrompt:"Drag a file here to upload",clientFileHandler:null}};b.prototype.init=function(a,b){d.bindAll(this,"onDragOver","onDragEnd","onDrop");this.$target=c(a);this.options=c.extend({},this.getDefaults(),b);this.$target.attr("data-upload-prompt",
this.options.uploadPrompt);this._destroyables=[];this._destroyables.push(e.chainWith(this.$target).on("dragover",this.onDragOver).on("dragleave",this.onDragEnd).on("dragend",this.onDragEnd).on("drop",this.onDrop))};b.prototype.onDragOver=function(a){a.preventDefault();this.$target.addClass(this.options.activeDropTargetClass)};b.prototype.onDragEnd=function(a){a.preventDefault();this.$target.removeClass(this.options.activeDropTargetClass)};b.prototype.onDrop=function(a){a.preventDefault();a.originalEvent.preventDefault();
this.$target.removeClass(this.options.activeDropTargetClass);this.options.clientFileHandler&&this.options.clientFileHandler.handleFiles(a.originalEvent.dataTransfer.files,a.originalEvent.target)};b.prototype.destroy=function(){this.$target.removeAttr("data-upload-prompt");this.$target.removeClass(this.options.activeDropTargetClass);d.invoke(this._destroyables,"destroy")};return b});