define("bitbucket/internal/page/admin/authentication",["jquery","exports"],function(c,a){a.onReady=function(a,f){var b=c(f),d=c(a),e=function(){d.prop("checked")?b.prop("disabled",!1):(b.prop("disabled",!0),b.prop("checked",!1))};d.click(function(){e()});e()}});