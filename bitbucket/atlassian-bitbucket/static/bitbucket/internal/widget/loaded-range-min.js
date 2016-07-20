define("bitbucket/internal/widget/loaded-range",function(){function b(a){this.nextPageStart=this.start=void 0;this._reachedCapacity=this._reachedEnd=this._reachedStart=!1;this._capacity=a||Infinity}b.prototype.isEmpty=function(){return void 0===this.start};b.prototype.isBeforeStart=function(a){return a<this.start};b.prototype.isAfterNextPageStart=function(a){return a>this.nextPageStart};b.prototype.isLoaded=function(a){return!(this.isEmpty()||this.isBeforeStart(a)||this.isAfterNextPageStart(a))};
b.prototype.getAttachmentMethod=function(a,b){return this.isEmpty()?"html":this.isBeforeStart(a)?"prepend":"append"};b.prototype.add=function(a,b,e,c){var d=this.isEmpty();c=c||a+b;if(d||this.isBeforeStart(a))this.start=a;if(d||this.isAfterNextPageStart(c))this.nextPageStart=c;this._reachedStart=this._reachedStart||0>=a;!(this._reachedEnd=this._reachedEnd||e)&&this.nextPageStart>=this._capacity&&(this._reachedCapacity=this._reachedEnd=!0);return this};b.prototype.reachedStart=function(){return this._reachedStart};
b.prototype.reachedEnd=function(){return this._reachedEnd};b.prototype.reachedCapacity=function(){return this._reachedCapacity};b.prototype.pageBefore=function(a){if(this.reachedStart())return null;a=Math.max(0,this.start-a);return{start:a,limit:this.start-a}};b.prototype.pageAfter=function(a){return this.reachedEnd()?null:{start:this.nextPageStart,limit:a}};return b});