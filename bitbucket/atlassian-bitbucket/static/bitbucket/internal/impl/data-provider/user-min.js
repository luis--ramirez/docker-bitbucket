define("bitbucket/internal/impl/data-provider/user",["lodash","bitbucket/util/navbuilder","bitbucket/internal/bbui/data-provider/user","bitbucket/internal/model-transformer","bitbucket/internal/util/object"],function(e,g,a,h,k){function b(b,c){a.apply(this,arguments)}function l(b,c,a){var d={avatarSize:bitbucket.internal.widget.avatarSizeInPx({size:b||"small"})};a&&(d.filter=a);c&&c.forEach(function(b,a){var c="permission"+(a?"."+a:"");Object.keys(b).forEach(function(a){if("name"===a)d[c]=m[b.name]||
b.name;else{var f=e.camelCase(a);d[c+"."+f]=e.endsWith(f,"id")?Number(b[a]):b[a]}})});return d}k.inherits(b,a);b.prototype._getBuilder=function(){return g.rest().users().withParams(l(this.options.avatarSize,this.options.filter.permissions,this.options.filter.term))};b.prototype._transform=function(a){return a.values.map(h.user)};var m={KNOWN_USER:"LICENSED_USER"};return b});