define("bitbucket/internal/widget/paste-image-target",["jquery","lodash","bitbucket/internal/util/events","bitbucket/internal/util/function","bitbucket/internal/widget/client-file-handlers/client-file-handler"],function(d,c,e,f,g){function b(a,c){this.init.apply(this,arguments)}b.prototype.init=function(a,b){c.bindAll(this,"handlePaste","processClipboardItem");this.$el=d(a);this.clientFileHandler=b;this._destroyables=[];this._destroyables.push(e.chainWith(this.$el).on("paste",this.handlePaste))};
b.prototype.handlePaste=function(a){var b=g.typeFilters.image;a=a.originalEvent;a=a.clipboardData&&a.clipboardData.items;this.clientFileHandler&&a&&1===a.length&&c.toArray(a).filter(c.compose(b.test.bind(b),f.dot("type"))).forEach(this.processClipboardItem)};b.prototype.processClipboardItem=function(a){a=a.getAsFile();a.name="upload."+c.last(a.type.split("/"));this.clientFileHandler.handleFiles([a],this.$el)};b.prototype.destroy=function(){c.invoke(this._destroyables,"destroy")};return b});