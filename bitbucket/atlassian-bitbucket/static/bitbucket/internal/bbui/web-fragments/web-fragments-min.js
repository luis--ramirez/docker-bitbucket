define("bitbucket/internal/bbui/web-fragments/web-fragments",["exports","../javascript-errors/javascript-errors"],function(a,c){Object.defineProperty(a,"__esModule",{value:!0});a.FragmentType=void 0;a.FragmentType={ITEM:"ITEM",SECTION:"SECTION",PANEL:"PANEL"};var e=function(){function a(){babelHelpers.classCallCheck(this,a)}babelHelpers.createClass(a,[{key:"getWebItems",value:function(b,d){throw new c.NotImplementedError;}},{key:"getWebSections",value:function(b,d){throw new c.NotImplementedError;
}},{key:"getWebPanels",value:function(b,d){throw new c.NotImplementedError;}},{key:"getWebFragments",value:function(b,d,a){throw new c.NotImplementedError;}}],[{key:"getExampleItem",value:function(b,d){var a=d&&Object.keys(d).join(", ")||"(none)";return{type:"ITEM",completeModuleKey:b+":example-web-item",weight:1E3,location:b,url:"#example-web-item-url",key:"example-web-item",text:"Client Web Item: "+b,params:{},id:null,cssClass:"plugin-point",tooltip:"Client Context Items: "+a,iconUrl:null,iconWidth:0,
iconHeight:0}}},{key:"getExampleSection",value:function(b,a){return{type:"SECTION",completeModuleKey:b+":example-web-section",weight:1E3,location:b,key:"example-web-section",text:"Client Web Section: "+b,params:{}}}},{key:"getExamplePanel",value:function(b,a){var c=a&&Object.keys(a).join(", ")||"(none)";return{type:"PANEL",completeModuleKey:b+":example-web-panel",weight:1E3,location:b,key:"example-web-panel",html:'\x3cdiv class\x3d"plugin-point web-panel"\x3e\x3cstrong\x3eClient Web Panel\x3c/strong\x3e: '+
b+"\x3cbr /\x3e\x3cstrong\x3eClient Context Items\x3c/strong\x3e: "+c+"\x3c/div\x3e",params:{}}}}]);return a}();a.default=e});