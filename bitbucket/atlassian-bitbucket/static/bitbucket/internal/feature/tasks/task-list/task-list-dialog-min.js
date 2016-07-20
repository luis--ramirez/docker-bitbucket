define("bitbucket/internal/feature/tasks/task-list/task-list-dialog","aui jquery lodash bitbucket/util/events bitbucket/util/navbuilder bitbucket/util/server bitbucket/internal/feature/tasks/model/task-state bitbucket/internal/feature/tasks/task-list/task-list-table".split(" "),function(k,e,l,g,m,n,h,p){function c(b){this.init.apply(this,arguments)}function f(b){var d={E:"bitbucket.internal.feature.tasks.dialog.action.edit",J:"bitbucket.internal.feature.tasks.dialog.action.moveNext",K:"bitbucket.internal.feature.tasks.dialog.action.movePrevious",
O:"bitbucket.internal.feature.tasks.dialog.action.open",SPACE:"bitbucket.internal.feature.tasks.dialog.action.transitionToNextState",DELETE:"bitbucket.internal.feature.tasks.dialog.action.delete"},a={69:"E",74:"J",75:"K",79:"O",32:"SPACE",46:"DELETE"}[b.keyCode];"TEXTAREA"!==b.target.nodeName&&a&&(g.trigger(d[a]),b.preventDefault())}var q=m.rest().currentPullRequest().addPathComponents("tasks","count").build();c.prototype.init=function(b){l.bindAll(this,"openDialog","updateDialog","closeDialog","_updateTaskCounts");
var d=bitbucket.internal.feature.tasks.taskList.dialog(),a=e("#task-list-dialog");0<a.length&&a.remove();e(document.body).append(d);this._dialog=k.dialog2("#task-list-dialog");this._table=null;this._taskCollection=b;jQuery("#dialog-close-button").click(this.closeDialog);g.on("bitbucket.internal.feature.tasks.visit-task",this.closeDialog);this._dialog.on("show",function(){e(document).on("keydown",f)});this._dialog.on("hide",function(){e(document).off("keydown",f)})};c.prototype.updateDialog=function(){this._table&&
this._table.update()};c.prototype.openDialog=function(b){this._dialog.show();if(!this._table){var d=this._dialog.$el.find(".aui-dialog2-content"),a=this._dialog.$el.find("#task-list-dialog-list");this._table=new p(a,d,this._taskCollection,b);this._table.on("dataLoaded",this._updateTaskCounts.bind(this,b))}this._table.update()};c.prototype._updateTaskCounts=function(b,d){var a,c=new e.Deferred;if(d.isLastPage){a=this._taskCollection.groupBy("state");var f=a[h.OPEN];a=a[h.RESOLVED];c.resolve({open:f?
f.length:0,resolved:a?a.length:0})}else c=n.rest({url:q});c.done(function(a){g.trigger("bitbucket.internal.feature.pull-request-tasks.set-counts",null,{openTaskCount:a.open,resolvedTaskCount:a.resolved,pullRequestId:b.pullRequestId,repositoryId:b.repository.id,isReset:!0})})};c.prototype.closeDialog=function(){this._dialog.hide()};return c});