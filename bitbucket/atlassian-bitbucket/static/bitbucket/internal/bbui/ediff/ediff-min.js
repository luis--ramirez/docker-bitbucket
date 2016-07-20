define("bitbucket/internal/bbui/ediff/ediff",["exports"],function(m){function w(h){var d=[],f=void 0;for(t.lastIndex=0;f=t.exec(h);)d.push({start:f.index,value:f[0],end:t.lastIndex});return d}function u(h){var d=h.comparableValue,f=void 0;"string"!==typeof d&&(f=d=h.value,x.lastIndex=0,x.test(f)&&(0===h.start&&(f="\n"+f),-1!==f.indexOf("\n")&&(d=f.replace(C,"\n"))),h.comparableValue=d);return d}function y(h,d,f,b,k){for(var l=f;l<f+b;l++){var c=d.length-1,e=d.length&&d[c],a=h[l];e&&e.end===a.start?
d[c]={start:e.start,end:a.end,type:e.type}:d.push({start:a.start,end:a.end,type:k})}}function z(h,d){var f=[];if(0!==h.length||0!==d.length){var b;a:{b=h.length;var k=d.length,l=b+k+1,c=1+2*l,e=(c+1)/2,a=[];a.length=c;a[e+1]={i:0,j:-1,prev:null,snake:!0};for(c=0;c<l;c++){for(var q=-c;q<=c;q+=2){var m=e+q,n=m+1,r=m-1,g=void 0,p=void 0;q===-c||q!==c&&a[r].i<a[n].i?(p=a[n].i,g=a[n]):(p=a[r].i+1,g=a[r]);a[r]=null;for(var n=p-q,r=p,t=n;g&&0!==g.i&&0!==g.j&&!g.snake&&g.prev;)g=g.prev;for(g={i:r,j:t,prev:g};p<
b&&n<k&&u(h[p])===u(d[n]);)p++,n++;p>g.i&&(g={i:p,j:n,prev:g,snake:!0});a[m]=g;if(p>=b&&n>=k){b=a[m];break a}}a[e+c-1]=null}throw Error("could not find a diff path");}b.snake&&(b=b.prev);for(;b&&b.prev&&0<=b.prev.j;){if(b.snake)throw Error("bad diffpath: found snake when looking for diff");a=b.i;e=b.j;b=b.prev;k=b.i;l=b.j;a-=k;e-=l;f.unshift({from:k,fromCount:a,to:l,toCount:e,type:0===a&&A||0===e&&B||v});b.snake&&(b=b.prev)}}b=[];k=[];l=f.length;e=void 0;for(e=0;e<l;e++)a=f[e],c=a.type,c!==v&&c!==
B||y(h,b,a.from,a.fromCount,c),c!==v&&c!==A||y(d,k,a.to,a.toCount,c);return{originalRegions:b,revisedRegions:k}}Object.defineProperty(m,"__esModule",{value:!0});m.tokenizeString=w;m.getTokensComparableValue=u;m.diff=z;var t=/\w+|\s+|./gim,C=/\n[ \u00a0\t\r]+/mg,x=/\s/m,A="add",B="delete",v="change";m.default={tokenizeString:w,getTokensComparableValue:u,diff:z}});