/* globals goog:false */
//backend has it, but frontend doesn't. Adding it manually.
goog.string.newLineToBr = function(str, nfi) {
    return str.replace(/\r\n|\r|\n/g, '<br/>');
};