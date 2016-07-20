'use strict';

define('bitbucket/internal/util/parse-commit-message', [], function () {

    'use strict';

    var delimiters = ["\n\n", "\n", ". "];

    return {
        /**
         * Parses commit messages and splits them into separate subject and message components.
         *
         * This function should be kept in sync with ParseCommitMessageFunction.java
         *
         * @param {string} commtMessage - Commit message to parse
         * @return {object}             - The split subject and message parts
         */
        splitIntoSubjectAndBody: function splitIntoSubjectAndBody(commitMessage) {
            for (var i = 0; i < delimiters.length; i++) {
                var delimiter = delimiters[i];
                var index = commitMessage.indexOf(delimiter);

                if (index !== -1) {
                    var subject = commitMessage.substring(0, index).replace(/\n/g, ' ') + delimiter.trim();
                    var body = commitMessage.substring(index + delimiter.length);
                    return this.subjectAndBody(subject, body);
                }
            }
            return this.subjectAndBody(commitMessage, "");
        },

        /**
         * Creates an object with the subject and message as separate components in the object
         *
         * @param {string} subject - the commit subject
         * @param {string} body    - the commit message content
         * @returns {object}       - a composed object with the subject and message parts
         */
        subjectAndBody: function subjectAndBody(subject, body) {
            return {
                subject: subject,
                body: body
            };
        }
    };
});