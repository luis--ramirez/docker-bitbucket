'use strict';

define('bitbucket/internal/model/person', ['backbone-brace'], function (Brace) {

    'use strict';

    /**
     * @type {Person}
     */

    return Brace.Model.extend({
        namedAttributes: {
            'emailAddress': 'string',
            'name': 'string'
        },
        idAttribute: 'name',
        initialize: function initialize() {

            // If there isn't an ID attribute in the namedAttributes, set the
            // ID to the value of the property that the idAttribute points to
            if (this.namedAttributes.id == null) {
                this.setId(this.attributes[this.idAttribute]);
            }
        }
    });
});