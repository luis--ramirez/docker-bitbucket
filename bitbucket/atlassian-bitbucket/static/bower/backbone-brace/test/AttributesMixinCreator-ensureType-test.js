(function() {
	// calling bind means indexes sometimes show up as the message.
	function strMsg(msg) {
		return typeof msg === 'string' ? msg : undefined;
	}
	function passes(type, val, msg) {
		if (isNaN(val)) {
			ok (isNaN(Brace.AttributesMixinCreator.ensureType(type, val)), strMsg(msg));
		} else {
			strictEqual(Brace.AttributesMixinCreator.ensureType(type, val), val, strMsg(msg));	
		}
	}
	function coerces(type, val, coercedVal, msg) {
		if (isNaN(coercedVal)) {
			ok (isNaN(Brace.AttributesMixinCreator.ensureType(type, val)), strMsg(msg));
		} else {
			deepEqual(Brace.AttributesMixinCreator.ensureType(type, val), coercedVal, strMsg(msg));	
		}
	}

	function fails(type, val) {
		raises(function() {
			Brace.AttributesMixinCreator.ensureType(type, val);
		});	
	}

	function testType(type, passersAndFailers) {
		if (passersAndFailers.pass) {
			_.each(passersAndFailers.pass, _.bind(passes, null, type));
		}
		if (passersAndFailers.coerce) {
			_.each(passersAndFailers.coerce, function(inOutArr) {
				coerces(type, inOutArr[0], inOutArr[1] || inOutArr[0] );
			});
		}
		if (passersAndFailers.fail) {
			_.each(passersAndFailers.fail, _.bind(fails, null, type));
		}
	}

	module('AttributesMixinCreator.ensureType');

	test('Does no validation when type is false, null, or undefined', function() {
		function falsyTypeReturnsVal(falsy) {
			testType(falsy, {
				pass : [
					null,
					undefined,
					false,
					{},
					[],
					function() {},
					'string',
					'',
					Backbone.Collection
				]
			});
		}

		_.each([ false, null, undefined ], falsyTypeReturnsVal);
	});

	test('Uses typeof when type is a string', function() {

		testType('number', {
			pass : [
				null,
				undefined,
				0,
				1,
				NaN
			],
			fail : [
				false,
				true,
				'',
				'0',
				{},
				[],
				function() {}
			]
		});

		testType('boolean', {
			pass : [
				null,
				undefined,
				false,
				true
			],
			fail : [
				0,
				1,
				NaN,
				'',
				'0',
				{},
				[],
				function() {}
			]
		});

		testType('string', {
			pass : [
				null,
				undefined,
				'',
				'0'
			],
			fail : [
				0,
				1,
				NaN,
				false,
				true,
				{},
				[],
				function() {}
			]
		});

		testType('object', {
			pass : [
				null,
				undefined,
				{},
				[]
			],
			fail : [
				0,
				1,
				NaN,
				'',
				'0',
				false,
				true,
				function() {}
			]
		});

		testType('function', {
			pass : [
				null,
				undefined,
				function() {}
			],
			fail : [
				0,
				1,
				NaN,
				'',
				'0',
				false,
				true,
				{},
				[]
			]
		});

		// don't care about checking typeof undefined.
	});

	test('validates untyped arrays', function() {
		function testUntypedArray(type) {
			testType(type, {
				pass : [
					[],
					[1, 'two', {}],
					null,
					undefined,
					arguments
				],
				fail : [
					'hi',
					false,
					true,
					0,
					1,
					NaN,
					{},
					function() {},
					new Backbone.Collection()
				]
			});
		}

		_.each([Array, [], [undefined], [null], [false] ], testUntypedArray);
	});

	test('validates typed arrays', function() {
		testType([ 'string' ], {
			pass : [
				null,
				undefined
			],
			coerce : [
				[ [] ],
				[ [ 'hi' ] ],
				[ { length : 1, 0 : 'hi' }, [ 'hi' ] ]
			],
			fail : [
				'hi',
				[ 1 ],
				new Backbone.Collection()
			]
		});
		
		testType([ Date ], {
			coerce : [
				[ [] ],
				[ [ new Date() ] ],
				[ [ 'hi' ], [ new Date(NaN) ] ],
				[ { length : 1, 0 : 'Jan 6 1986' }, [ new Date(1986, 0, 6) ] ]
			],
			fail : [
				'hi',
				new Backbone.Collection()
			]
		});

		var Model = Brace.Model.extend({
			namedAttributes : [ 'red', 'green' ]
		});
		testType([ Model ], {
			coerce : [
				[ [] ],
				[ [ { red : 1, green : 6 } ], [ new Model({ red : 1, green : 6 }) ] ]
			],
			fail : [
				[ { red : 1, blue : 6 } ]
			]
		});
	});

	test('validates Collections', function() {
		var Model = Brace.Model.extend({
			namedAttributes : [ 'red', 'green' ]
		});
		var Collection = Brace.Collection.extend({
			model : Model
		});
		testType(Collection, {
			pass : [
				new Collection()
			],
			coerce : [
				[ [], new Collection() ],
				[ [ { red : 1, green : 6 } ], new Collection([ new Model({ red : 1, green : 6 }) ]) ]
			],
			fail : [
				[ { red : 1, blue : 6 } ],
				new Date(),
				Brace.Collection.extend()
			]
		});
	});

	test('validates arbitrary constructors', function() {
		testType(Date, {
			pass : [
				null,
				undefined,
				new Date('blam')
			],
			coerce : [
				[ 'blam', new Date('blam') ],
				[ 0, new Date(0) ]
			]
		});
		
		var called = false;
		function Ctor() {
			called = true;
			this.prop = true;
		}
		var val = new Ctor();
		called = false;

		testType(Ctor, { pass : [ val ] });
		ok(!called, 'Ctor should not be called, since val is instanceof Ctor');

		testType(Ctor, {
			coerce : [
				[ 0, val ],
				[ NaN, val ],
				[ Date, val ],
				[ [], val ],
				[ new Backbone.Collection(), val ],
				[ '0', val ],
				[ true, val ],
				[ false, val ]
			]
		});
	});

    test('ensure round trip', function() {
        var User = Brace.Model.extend({
            namedAttributes : {
                name: 'string',
                emailAddress: 'string'
            }
        });
        var UserCollection = Brace.Collection.extend({
            model: User
        });
        var ChatRoom = Brace.Model.extend({
            namedAttributes : {
                title: 'string',
                users: UserCollection,
                otherUsers : [ User ]
            }
        });
        var json = {
            title: 'Backbone brace help',
            users: [
                {
                    name: 'Joe',
                    emailAddress: 'joe@example.com'
                },
                {
                    name: 'Jill',
                    emailAddress: 'jill@example.org'
                }
            ],
            otherUsers: [
                {
                    name: 'Jan',
                    emailAddress: 'jan@example.com'
                },
                {
                    name: 'James',
                    emailAddress: 'james@example.org'
                }
            ]
        };
        deepEqual(new ChatRoom(json).toJSON(), json);
    });
}());