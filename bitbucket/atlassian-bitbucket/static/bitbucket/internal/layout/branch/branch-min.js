define("bitbucket/internal/layout/branch","jquery lodash bitbucket/util/navbuilder bitbucket/internal/feature/repository/revision-reference-selector bitbucket/internal/layout/branch/branch-layout-analytics bitbucket/internal/model/page-state bitbucket/internal/model/revision-reference bitbucket/internal/util/events bitbucket/internal/util/shortcuts exports".split(" "),function(b,h,m,k,n,e,p,c,q,f){f.onReady=function(f,g){g=g||"at";var d=new k(b(f),{id:"repository-layout-revision-selector-dialog",
dataTransform:function(a){a=k.prototype._addRefTypeAndRepositoryToResults.call(this,a);var c=m.parse(window.location.href);h.each(a.values,function(a){if(!a.url){var b=c.clone();b.replaceQueryParam(g,a.id);a.url=b.query()+(b.anchor()?b.anchor():"")}});return a}});q.bind("branchSelector",h.ary(b.fn.click.bind(d.$trigger),0));e.setRevisionRef(d.getSelectedItem());c.on("bitbucket.internal.feature.repository.revisionReferenceSelector.revisionRefChanged",function(a){this===d&&(c.trigger("bitbucket.internal.layout.branch.revisionRefChanged",
this,a),e.setRevisionRef(d.getSelectedItem()))});c.on("bitbucket.internal.page.*.revisionRefChanged",function(a){d.setSelectedItem(p.hydrateDeprecated(a))});c.on("bitbucket.internal.widget.keyboard-shortcuts.register-contexts",function(a){a.enableContext("branch")});var r=b("#branch-actions"),l=b("#branch-actions-menu");l.on("aui-dropdown2-show",function(){c.trigger("bitbucket.internal.layout.branch.actions.dropdownShown");r.focus();b(this).html(bitbucket.internal.layout.branch.actionsDropdownMenu({repository:e.getRepository().toJSON(),
atRevisionRef:e.getRevisionRef().toJSON()}))}).on("aui-dropdown2-hide",function(){c.trigger("bitbucket.internal.layout.branch.actions.dropdownHidden")});n.initLayoutAnalytics(l)}});