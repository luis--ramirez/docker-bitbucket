'use strict';

define('bitbucket/internal/util/abbreviate-commit-message', [], function () {

    'use strict';

    /**
     * Abbreviates commit messages by preferring to keep the first line in its entirety if its shorter than max.
     *
     * This function should be kept in sync with AbbreviatedCommitMessageFunction
     *
     * @param {string} message - Commit message to abbreviate
     * @param {int} max        - The max number of chars to return
     * @return {string}        - the abbreviated commit message.
     */

    return function abbreviateCommitMessage(message, max) {
        max = parseInt(max, 10);

        var replace = "...";

        if (message.length <= max) {
            return message;
        }

        var endOfFirstLine = message.indexOf('\n');
        if (endOfFirstLine > 0 && endOfFirstLine <= max) {
            return message.substring(0, endOfFirstLine + replace.length > max ? max - replace.length : endOfFirstLine) + replace;
        }

        return message.substring(0, max - replace.length) + replace;
    };
});