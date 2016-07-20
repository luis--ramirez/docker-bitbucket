define("bitbucket/internal/page/admin/applinks-spi-impl", [], function () {
    "use strict";

    /* global AppLinks: true, AJS : false */
    AppLinks = window.AppLinks || {};
    AppLinks.SPI = jQuery.extend(AppLinks.SPI || {}, {
        showCreateEntityLinkSuggestion: function showCreateEntityLinkSuggestion() {
            return false;
        }
    });
});