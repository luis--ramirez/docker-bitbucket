define("bitbucket/internal/feature/repository/ref-lozenge",["jquery"],function(d){d(".ref-lozenge").tooltip({live:!0,title:"data-ref-tooltip",hoverable:!0,gravity:function(){return d.fn.tipsy.autoNS.call(this)+d.fn.tipsy.autoWE.call(this)},delayIn:500,className:function(){var a=d(".tipsy"),c=a[0],b=a.prop("className"),e=/tipsy-[ns]?e/.test(b),b=/tipsy-s/.test(b),f=e?c.offsetWidth:void 0,g=b?c.offsetHeight:void 0;a.addClass("ref-lozenge-tooltip");e&&(e=c.offsetWidth-f,f=parseFloat(a.css("left"),10),
a.css("left",f-e+"px"));b&&(c=c.offsetHeight-g,b=parseFloat(a.css("top"),10),a.css("top",b-c+"px"));return"ref-lozenge-tooltip"}})});require("bitbucket/internal/feature/repository/ref-lozenge");