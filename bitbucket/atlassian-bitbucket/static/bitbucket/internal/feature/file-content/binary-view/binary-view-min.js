define("bitbucket/internal/feature/file-content/binary-view",["aui","jquery","lodash","bitbucket/util/navbuilder","exports"],function(e,d,f,g,c){function h(b){return{$elem:d(bitbucket.internal.feature.fileContent.binaryView.unrenderable({downloadUrl:b,descriptionContent:e.I18n.getText("bitbucket.web.diffview.binary.unrenderable.description")})),type:"link"}}function a(b,a){return{$elem:d(bitbucket.internal.feature.fileContent.binaryView.image({src:b,extraAttributes:{"data-ext":a.extension.toLowerCase()}})),
type:"image"}}var k={png:a,jpg:a,jpeg:a,bmp:a,ico:a,gif:a,svg:a},l=["svg"];c.getRenderedBinary=function(b,a){var d=b.extension&&b.extension.toLowerCase(),c;c=g.currentRepo().raw().path(b.components).at(a).build();return(k[d]||h)(c,b)};c.treatTextAsBinary=function(a){return a&&0<=f.indexOf(l,a)}});