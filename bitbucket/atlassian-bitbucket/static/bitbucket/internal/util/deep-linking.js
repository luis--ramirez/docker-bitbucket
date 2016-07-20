'use strict';

define('bitbucket/internal/util/deep-linking', ['lodash', 'bitbucket/internal/util/function', 'bitbucket/internal/util/math', 'exports'], function (_, fn, math, exports) {

    'use strict';

    /**
     * Extract the selected line numbers from a url hash fragment and return as an optimised set of numbers
     * (Numbers are sorted and deduped)
     * Support single line numbers, ranges and multiple non-contiguous lines/ranges
     * Tolerates multi-step ranges (#1-3-5), out of order ranges (#5-1), and duplicates (#2,2,1-3)
     * @param {string} hash - The url hash fragment
     *
     * @example getLineNumbersFromHash('#5,8,10-15') //=> [5,8,10,11,12,13,14,15]
     *
     * @returns {Array<number>}
     */

    function hashToLineNumbers(hash) {
        hash = hash != null ? hash.replace(/[#\s]/g, '') : '';

        if (!/^[0-9,\-]+$/.test(hash)) {
            //pretty loose regex, but good enough to avoid errors (the parse is pretty forgiving)
            return [];
        }

        return _.chain(hash.split(',')).filter().map(function (maybeRange) {
            var steps = _.chain(maybeRange.split('-')).map(fn.unary(parseInt)).filter(fn.not(isNaN)).map(math.highPass(1)) //Line numbers are 1 indexed
            .sortBy().value();

            return steps.length ? _.range(_.first(steps), _.last(steps) + 1) : [];
        }).flatten().uniq().sortBy().value();
    }

    /**
     * Take a set of line numbers and return the optimised string representation of it.
     * (collapse contiguous numbers to ranges) i.e. 10, 11, 12, 13, 14, 15 => 10-15
     * @param {Array<number>} lineNumbers
     *
     * @example lineNumbersToHash([5,8,10,11,12,13,14,15]) //=> '5,8,10-15'
     *
     * @returns {string}
     */
    function lineNumbersToHash(lineNumbers) {
        return _.chain(lineNumbers).uniq().filter(fn.and(_.isNumber, _.isFinite, math.isPositive)).sortBy().reduce(_lineNumbersToHash, '').value();
    }

    /**
     * Reduce an array of line numbers into an optimised string representation
     * @param {string} hash - The memo string built by the reduce
     * @param {number} lineNumber - The number to add to the string
     * @param {number} index - The position in the lineNumbers array of lineNumber
     * @param {Array<number>} lineNumbers - A sorted and deduped array of line numbers
     *
     * @returns {string}
     * @private
     */
    function _lineNumbersToHash(hash, lineNumber, index, lineNumbers) {
        if (index === 0) {
            //The first number always just gets added to the hash
            return hash + lineNumber;
        }

        var prevLineNumber = lineNumbers[index - 1];

        if (lineNumber !== prevLineNumber + 1) {
            //If this line doesn't immediately follow the previous line in the selection
            if (_.last(hash) === '-') {
                //If we had already started a range, finish it with the previous line (the last one in the unbroken sequence)
                hash += prevLineNumber;
            }
            //Start a new independent selection
            return hash + ',' + lineNumber;
        }

        //At this point we know that the lineNumber follows on sequentially from the previous line in the selection

        if (_.last(hash) !== '-') {
            //If we haven't already started a range, start one now
            hash += '-';
        }

        if (index === lineNumbers.length - 1) {
            // If this is the last lineNumber in the selection,
            // close off the open range (implied by not returning earlier) with it.
            hash += lineNumber;
        }

        return hash;
    }

    /**
     * Manipulate the current selection by either extending the range or adding a new independent line
     * @param {number} newLineNumber - The new line number to add or extend the range to
     * @param {Object} options
     * @param {Array<number>?}  [options.existingLineNumbers] - The already selected line numbers
     * @param {boolean?}        [options.selectRange] - Whether to extend the range or not (i.e. add an independent line)
     * @param {number?}         [options.lastSelected] - The last line number that was selected, used to anchor a range extension
     *
     * @example updateSelectionRange(5, [1,2,3], true, 3) //=> [1,2,3,4,5]
     *
     * @returns {Array<number>}
     */
    function updateSelectionRange(newLineNumber, options) {
        var newLineNumbers;
        options = _.extend({
            existingLineNumbers: [],
            selectRange: false,
            lastSelected: undefined
        }, options);

        if (options.selectRange && options.lastSelected) {
            //Add a range to the selection bounded by the new line and the last selected line
            var newRange = _.range(Math.min(newLineNumber, options.lastSelected), Math.max(newLineNumber, options.lastSelected) + 1);

            if (!_.difference(newRange, options.existingLineNumbers).length) {
                //If the new range is completely contained by the existing range, subtract it except for the newly selected line
                newLineNumbers = _.difference(options.existingLineNumbers, _.without(newRange, newLineNumber));
            } else {
                //If the new range is not completely contained (partially contained is ok) extend the range to include it
                newLineNumbers = options.existingLineNumbers.concat(newRange);
            }
        } else {
            //add a new independent line or remove it from the current selection if it already exists
            if (_.contains(options.existingLineNumbers, newLineNumber)) {
                newLineNumbers = _.without(options.existingLineNumbers, newLineNumber);
            } else {
                newLineNumbers = options.existingLineNumbers.concat(newLineNumber);
            }
        }

        //dedupe and sort the lineNumbers
        return _.chain(newLineNumbers).uniq().sortBy().value();
    }

    exports.hashToLineNumbers = hashToLineNumbers;
    exports.lineNumbersToHash = lineNumbersToHash;
    exports.updateSelectionRange = updateSelectionRange;
});