define("bitbucket/internal/layout/project",["jquery","bitbucket/internal/model/page-state","bitbucket/internal/model/project","bitbucket/internal/widget/sidebar"],function(a,b,c,d){return{onReady:function(e){a(document).ready(d.onReady);b.setProject(new c(e))}}});