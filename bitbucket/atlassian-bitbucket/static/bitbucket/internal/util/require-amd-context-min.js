define("bitbucket/internal/util/require-amd-context",["jquery"],function(b){return function(c,d){return WRM.require("wrc!"+c).pipe(function(){var a=b.Deferred();require(d,function(){a.resolve.apply(a,arguments)});return a.promise()})}});