define('bitbucket/internal/feature/integrity/banner', ['exports', 'aui', 'jquery', 'bitbucket/util/navbuilder', 'bitbucket/internal/util/ajax'], function (exports, _aui, _jquery, _navbuilder, _ajax) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.init = init;

    var _aui2 = babelHelpers.interopRequireDefault(_aui);

    var _jquery2 = babelHelpers.interopRequireDefault(_jquery);

    var _navbuilder2 = babelHelpers.interopRequireDefault(_navbuilder);

    var _ajax2 = babelHelpers.interopRequireDefault(_ajax);

    var MESSAGE_ID = 'integrity-check-message';
    var MessageType = {
        INFO: 'info',
        WARN: 'warning'
    };
    var State = {
        STARTED: {
            id: MESSAGE_ID,
            closeable: false,
            title: _aui2.default.I18n.getText('bitbucket.web.admin.integrity.check.started.banner.title'),
            body: _aui2.default.I18n.getText('bitbucket.web.admin.integrity.check.started.banner.text')
        },
        INCONSISTENT: {
            id: MESSAGE_ID,
            closeable: false,
            title: _aui2.default.I18n.getText('bitbucket.web.admin.integrity.check.inconsistent.banner.title'),
            body: _aui2.default.I18n.getText('bitbucket.web.admin.integrity.check.inconsistent.banner.text')
        },
        COMPLETED: {
            id: MESSAGE_ID,
            title: _aui2.default.I18n.getText('bitbucket.web.admin.integrity.check.completed.banner.title'),
            body: _aui2.default.I18n.getText('bitbucket.web.admin.integrity.check.completed.banner.text')
        },
        INCONSISTENT_COMPLETED: {
            id: MESSAGE_ID,
            title: _aui2.default.I18n.getText('bitbucket.web.admin.integrity.check.inconsistent.completed.banner.title'),
            body: _aui2.default.I18n.getText('bitbucket.web.admin.integrity.check.inconsistent.completed.banner.text')
        }
    };

    function init(bannerId, states) {
        var _state = void 0;
        var messageType = void 0;
        switch (states[0]) {
            case 'acknowledged':
                // Bail out. The banner need not be shown.
                return;
            case 'started':
                messageType = MessageType.INFO;
                _state = State.STARTED;
                break;
            case 'inconsistency':
                if (states[1] === 'started') {
                    messageType = MessageType.WARN;
                    _state = State.INCONSISTENT;
                } else {
                    // Bail out. The banner need not be shown.
                    // This can happen when triggering checks via REST.
                    return;
                }
                break;
            case 'completed':
                // Done
                if (states[1] === 'inconsistency') {
                    messageType = MessageType.WARN;
                    _state = State.INCONSISTENT_COMPLETED;
                } else {
                    messageType = MessageType.INFO;
                    _state = State.COMPLETED;
                }
                break;
            default:
                console.warn('Could not identify integrity checks state.', states);
                return;
        }

        _aui2.default.messages[messageType]('#' + bannerId, _state);

        var acknowledged = false; // TODO remove once https://ecosystem.atlassian.net/browse/AUI-4300 is fixed
        (0, _jquery2.default)(document).on('aui-message-close', function (e, message) {
            if (message[0] && message[0].id === MESSAGE_ID && _state === State.COMPLETED) {
                if (!acknowledged) {
                    acknowledged = true;
                    _ajax2.default.rest({
                        url: _navbuilder2.default.newBuilder('admin').addPathComponents('integrity-check', 'acknowledge').build(),
                        type: 'POST'
                    });
                }
            }
        });
    }
});