'use strict';

define('bitbucket/internal/feature/pull-request/metadata-generator', ['jquery', 'lodash', 'bitbucket/internal/util/parse-commit-message', 'bitbucket/internal/util/text', 'exports'], function ($, _, parseCommitMessage, textUtil, exports) {

    'use strict';

    var handlesNewlinesInTextCorrectly = $('<div>').text('\n').text().length === 1;

    function generateTitleAndDescriptionFromCommitMessage(commitMessage) {
        var parsedCommitMessage = parseCommitMessage.splitIntoSubjectAndBody(commitMessage);
        return titleAndDescription(parsedCommitMessage);
    }

    function titleAndDescription(parsedCommitMessage) {
        var croppedTitle = parsedCommitMessage.subject.substring(0, 255);
        return {
            title: croppedTitle,
            description: parsedCommitMessage.body
        };
    }

    function generateDescriptionFromCommitMessages(commitMessages) {
        if (!handlesNewlinesInTextCorrectly) {
            return;
        }

        var description = '';

        // If there's multiple commits put in a list
        if (commitMessages.length > 1) {
            commitMessages = _.map(commitMessages, convertMessageToListItem);
        }

        if (commitMessages.length > 0) {
            description = commitMessages.reverse() //oldest commits first.
            .join('').trim();
        }
        return description;
    }

    function convertMessageToListItem(message) {
        // Compress lines where more than one line is empty into one empty line. Otherwise it would be parsed as the
        // end of the list and the following lines would behave differently (e.g. get turned into code blocks).
        var newlinesReplaced = message.replace(/\n\n+/g, '\n\n');

        // Indent contents so they are nested under the commit list.
        var indentRegex = /\n(.)/g;
        var indentReplacement = '\n' + textUtil.indent('$1');

        var indented = newlinesReplaced.replace(indentRegex, indentReplacement);

        // For multi-paragraph messages, add empty line so that there's more space between this and next bullet
        var trailer = indented.indexOf('\n\n') !== -1 ? '\n\n' : '\n';
        return '* ' + indented + trailer;
    }

    exports.generateTitleAndDescriptionFromCommitMessage = generateTitleAndDescriptionFromCommitMessage;
    exports.generateDescriptionFromCommitMessages = generateDescriptionFromCommitMessages;
});