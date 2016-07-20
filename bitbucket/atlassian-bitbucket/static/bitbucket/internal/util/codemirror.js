'use strict';

define('bitbucket/internal/util/codemirror', ['codemirror'], function (CodeMirror) {

    var operationCodeMirror = null;

    /**
     * Runs an operation inside a CodeMirror operation
     *
     * Useful for batching multiple operations together so endOperation() is only called once.
     *
     * @param {Function} op - The function to run in the CodeMirror operation.
     * @returns {*} the result of `op()`
     */
    function doInOperation(op) {
        if (operationCodeMirror === null) {
            var el = document.createElement('div');
            operationCodeMirror = CodeMirror(el);
        }
        return operationCodeMirror.operation(op);
    }

    return {
        doInOperation: doInOperation
    };
});