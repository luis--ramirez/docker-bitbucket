define("bitbucket/internal/widget/aui/dropdown",["aui","jquery","exports"],function(b,c,d){d.onReady=function(){var a={dropDown:".aui-dropdown-left:not(.aui-dropdown-ajax)",alignment:"left"};b.dropDown.Standard(c.extend({},a));a.dropDown=".aui-dropdown-right:not(.aui-dropdown-ajax)";a.alignment="right";b.dropDown.Standard(c.extend({},a))}});