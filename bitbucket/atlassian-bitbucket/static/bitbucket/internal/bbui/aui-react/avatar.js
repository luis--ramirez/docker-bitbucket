define('bitbucket/internal/bbui/aui-react/avatar', ['exports', 'aui', 'classnames', 'react', 'bitbucket/internal/impl/urls'], function (exports, _aui, _classnames, _react, _urls) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.ProjectAvatar = undefined;

    var _aui2 = babelHelpers.interopRequireDefault(_aui);

    var _classnames2 = babelHelpers.interopRequireDefault(_classnames);

    var _react2 = babelHelpers.interopRequireDefault(_react);

    var _urls2 = babelHelpers.interopRequireDefault(_urls);

    /*
     * This file exposes a default UserAvatar, and a named ProjectAvatar.
     */

    // TODO should be refactored into multiple components
    /*eslint react/no-multi-comp:0 */
    // prop-types rule currently barfs on use of the spread operator
    /*eslint react/prop-types:0 */
    var commonPropTypes = {
        avatarAttrs: _react.PropTypes.object,
        avatarClassName: _react.PropTypes.string,
        // A list of possible badges to show for this avatar.
        // These will always be present in the DOM, for animation purposes
        badges: _react.PropTypes.arrayOf(_react.PropTypes.shape({
            className: _react.PropTypes.string,
            // for accessibility
            text: _react.PropTypes.string
        })),
        // Will be set on the outer-most element
        className: _react.PropTypes.string,
        // T-shirt sizing
        size: _react.PropTypes.string,
        // Set to false when `withName` is true
        tooltip: _react.PropTypes.bool,
        tooltipText: _react.PropTypes.string,
        // The single (if any) badge class name to be shown
        visibleBadge: _react.PropTypes.string,
        withLink: _react.PropTypes.bool,
        withName: _react.PropTypes.bool,
        withEmail: _react.PropTypes.bool
    };

    var commonDefaultProps = {
        badges: [],
        size: 'small',
        tooltip: true,
        tooltipText: '',
        withName: false,
        withEmail: false
    };

    var AvatarSizes = {
        xsmall: 16,
        small: 24,
        medium: 32,
        large: 48,
        xlarge: 64,
        xxlarge: 96,
        xxxlarge: 128
    };

    var UserAvatar = function UserAvatar(props) {
        var user = props.person.user || props.person;
        var displayableName = user.display_name || user.name;
        var fallbackTooltip = displayableName;

        var display = [];
        if (props.withName) {
            display.push(displayableName);
        }
        if (props.withEmail && user.email_address) {
            fallbackTooltip += ' (' + user.email_address + ')';
            display.push(_react2.default.createElement(
                'span',
                { key: 'email', className: 'email-address' },
                user.email_address
            ));
        }
        var avatarProps = {
            alt: displayableName,
            avatarAttrs: { 'data-username': user.name },
            avatarSrc: _urls2.default.avatarUrl(user, AvatarSizes[props.size]),
            badges: props.badges,
            className: (0, _classnames2.default)('user-avatar', props.avatarClassName, { 'badge-hidden': props.hideBadge }, props.withName || props.withEmail ? null : props.className),
            display: display,
            displayLink: _urls2.default.user(user),
            size: props.size,
            title: props.tooltip && (props.tooltipText || fallbackTooltip),
            tooltip: props.tooltip,
            visibleBadge: props.visibleBadge
        };
        return _react2.default.createElement(AvatarWrapper, babelHelpers.extends({}, props, { avatarProps: avatarProps }));
    };
    UserAvatar.defaultProps = babelHelpers.extends({}, commonDefaultProps);
    UserAvatar.propTypes = babelHelpers.extends({}, commonPropTypes, {
        person: _react.PropTypes.object.isRequired
    });

    exports.default = UserAvatar;
    var ProjectAvatar = exports.ProjectAvatar = function ProjectAvatar(props) {
        var avatarProps = {
            alt: props.project.name,
            avatarSrc: props.project.avatar_url || 'XXX TODO TEST',
            badges: props.badges,
            className: 'aui-avatar-project',
            display: props.project.name,
            displayLink: 'XXX TODO TEST',
            size: props.size,
            title: props.project.name,
            tooltip: props.tooltip,
            visibleBadge: props.visibleBadge
        };
        return _react2.default.createElement(AvatarWrapper, babelHelpers.extends({}, props, { avatarProps: avatarProps }));
    };
    ProjectAvatar.defaultProps = babelHelpers.extends({}, commonDefaultProps, {
        avatarAttrs: {}
    });
    ProjectAvatar.propTypes = babelHelpers.extends({}, commonPropTypes, {
        project: _react.PropTypes.object.isRequired
    });

    /**
     * An AUI avatar.
     *
     * @param {Object} props - The component properties
     * @param {string} props.alt - The text equivalent of the avatar
     * @param {string} props.avatarSrc - The URL to the avatar image
     * @param {Object} [props.avatarAttrs] - Attributes to be added to the top level avatar element
     * @param {string} [props.size=small] - The avatar size (using t-shirt sizes)
     * @param {string} [props.className] - Classes to be added to the top level avatar element
     * @param {Object} [props.badge] - badge containing a `className` and optional `text`
     * @param {string} props.title - Tooltip text for the avatar
     * @param {boolean} [props.tooltip=true] - Whether to show a tooltip for the avatar
     * @returns {ReactElement} The rendered component
     */
    var Avatar = function Avatar(props) {
        var alt = props.alt;
        var avatarSrc = props.avatarSrc;
        var size = props.size;
        var title = props.title;
        var avatarAttrs = props.avatarAttrs;


        var avatarClassNames = (0, _classnames2.default)(props.className, 'aui-avatar', 'aui-avatar-' + size, { 'aui-avatar-badged': props.badges.length });

        var imgAttrs = {
            alt: alt,
            ref: props.tooltip ? function (el) {
                return _aui2.default.$(el).tooltip();
            } : null,
            src: avatarSrc,
            title: props.tooltip ? title : undefined
        };

        var badges = props.badges.map(function (badge) {
            var badgeClasses = (0, _classnames2.default)('badge', badge.className, { 'badge-hidden': props.visibleBadge !== badge.className });
            return _react2.default.createElement(
                'span',
                { key: badge.className, className: badgeClasses },
                badge.text
            );
        });

        return _react2.default.createElement(
            'span',
            babelHelpers.extends({ className: avatarClassNames }, avatarAttrs),
            _react2.default.createElement(
                'span',
                { className: 'aui-avatar-inner' },
                _react2.default.createElement('img', imgAttrs)
            ),
            badges
        );
    };

    /**
     * A wrapper to determine whether to show the avatar's display name or not.
     * @param {Object} props - The component props
     * @returns {ReactElement}
     */
    var AvatarWrapper = function AvatarWrapper(props) {
        var avatarProps = props.avatarProps;


        if (!props.withName) {
            return _react2.default.createElement(Avatar, babelHelpers.extends({}, avatarProps, { className: (0, _classnames2.default)(avatarProps.className, props.className) }));
        }

        return _react2.default.createElement(
            'div',
            { className: (0, _classnames2.default)(props.className, 'avatar-with-name'), title: avatarProps.tooltip ? avatarProps.title : undefined },
            _react2.default.createElement(Avatar, babelHelpers.extends({}, avatarProps, { tooltip: false })),
            _react2.default.createElement(AvatarDisplay, { display: avatarProps.display, href: props.withLink ? avatarProps.displayLink : null })
        );
    };

    /**
     * The display name for an avatar, which may or may not be linked.
     * @param {Object} props - Component props
     * @returns {ReactElement}
     */
    var AvatarDisplay = function AvatarDisplay(props) {
        var display = props.display;
        var href = props.href;


        if (href) {
            return _react2.default.createElement(
                'a',
                { className: 'name', href: href },
                display
            );
        }

        return _react2.default.createElement(
            'span',
            { className: 'name' },
            display
        );
    };
});