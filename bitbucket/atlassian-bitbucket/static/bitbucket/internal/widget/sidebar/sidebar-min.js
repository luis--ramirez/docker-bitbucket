define("bitbucket/internal/widget/sidebar",["aui","jquery","bitbucket/internal/util/client-storage","bitbucket/internal/util/events","exports"],function(g,d,c,e,h){function k(){b.$el.find(".aui-sidebar-group-actions ul").on("click","\x3e li \x3e a[data-web-item-key]",function(){e.trigger("bitbucket.internal.ui.sidebar.actions-menu.item.clicked",null,{isCollapsed:!c.getItem("sidebar_expanded"),webItemId:d(this).attr("data-web-item-key")})});b.$el.find(".sidebar-navigation ul").on("click","\x3e li \x3e a[data-web-item-key]",
function(){var a=d(this),b=!c.getItem("sidebar_expanded"),f=a.parentsUntil(".aui-sidebar-group").filter("ul").length;e.trigger("bitbucket.internal.ui.sidebar.item.clicked",null,{webItemId:a.attr("data-web-item-key"),isCollapsed:b,level:f})});b.$el.find(".sidebar-settings-group").on("click","a",function(){e.trigger("bitbucket.internal.ui.sidebar.settings.clicked",null,{webItemId:d(this).attr("data-web-item-key")})});b.$el.on("click",".aui-sidebar-toggle",function(a){f("button")});b.$el.on("click",
".aui-sidebar-body",function(a){d(a.target).is(".aui-sidebar-body")&&f("sidebar")});g.whenIType("[").execute(function(){f("keyboard-shortcut")});b.on("expand-end collapse-end",function(a){a.isResponsive&&f("resize")})}function f(a){e.trigger("bitbucket.internal.ui.sidebar.collapse.change",null,{source:a,isCollapsed:!c.getItem("sidebar_expanded"),windowWidth:window.innerWidth})}var b;h.preload=function(){var a=!c.getItem("sidebar_expanded");d(document.body).toggleClass("aui-sidebar-collapsed",a);d(".aui-sidebar").attr("aria-expanded",
!a)};h.onReady=function(){b=g.sidebar(".aui-sidebar");b.on("collapse-end",function(a){a.isResponsive||c.setItem("sidebar_expanded",!1);e.trigger("bitbucket.internal.feature.sidebar.collapseEnd")});b.on("expand-start",function(a){a.isResponsive&&!1===c.getItem("sidebar_expanded")&&a.preventDefault()});b.on("expand-end",function(a){a.isResponsive||c.setItem("sidebar_expanded",!0);e.trigger("bitbucket.internal.feature.sidebar.expandEnd")});k()}});