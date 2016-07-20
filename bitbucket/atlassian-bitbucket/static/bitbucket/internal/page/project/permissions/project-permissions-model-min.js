define("bitbucket/internal/page/project/permissions/project-permissions-model",["backbone-brace","lodash","bitbucket/util/navbuilder","bitbucket/internal/util/ajax"],function(g,h,e,d){var b=g.Model.extend({namedAttributes:{grantedDefaultPermission:"string",publicAccess:"boolean"},getEffectiveDefaultPermission:function(){return this.getPublicAccess()&&this.getGrantedDefaultPermission()===b.NONE?b.READ:this.getGrantedDefaultPermission()},savePublicAccess:function(a){var c=this.getPublicAccess();this.setPublicAccess(a);
return b._sendSavePublicAccessRequest(a).fail(h.bind(function(){this.setPublicAccess(c)},this))},saveDefaultPermission:function(a){var c=b.unpackPermission(a),d=this,f=this.getGrantedDefaultPermission();this.setGrantedDefaultPermission(a);return b._sendSavePermissionRequest(e.rest().currentProject().permissions().projectRead().all(),c.read).then(function(){return b._sendSavePermissionRequest(e.rest().currentProject().permissions().projectWrite().all(),c.write).fail(function(){var a=b.unpackPermission(f).write;
c.write=a;d.setGrantedDefaultPermission(b.packPermission(c))})},function(){d.setGrantedDefaultPermission(f)})}},{WRITE:"write",READ:"read",NONE:"none",unpackPermission:function(a){return{read:a===b.WRITE||a===b.READ,write:a===b.WRITE}},packPermission:function(a){return a.write?b.WRITE:a.read?b.READ:b.NONE},_sendSavePermissionRequest:function(a,b){return d.rest({type:"POST",url:a.allow(b).build()})},_sendSavePublicAccessRequest:function(a){return d.rest({type:"PUT",url:e.rest().currentProject().build(),
data:{"public":a}})}});return b});