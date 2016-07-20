
module('Brace.Model');

test("Can create BaseModel with no namedAttributes defined", function() {
    Brace.Model.extend();
});

test("BaseModel adds mixin", function() {
    var TestMixin = {
        mixinProperty: "hi"
    };

    var TestModel = Brace.Model.extend({
        mixins: [TestMixin]
    });
    var testModelInstance = new TestModel();

    equals(testModelInstance.mixinProperty, "hi");
});

test("Mixin name clash fails violently on class declaration", function() {
    var TestMixin1 = {
        mixinProperty: "hi"
    };
    var TestMixin2 = {
        mixinProperty: "hi"
    };

    raises(function() {
        var TestModel = Brace.Model.extend({
            mixins: [TestMixin1, TestMixin2]
        });
    });
});

test("Mixin initialize is mixed in when class does not contain initialize method", function() {
    var TestMixin = {
        initialize: function() {
            this.mixin1Initialized = true;
        }
    };
    var TestModel = Brace.Model.extend({
        mixins: [TestMixin]
    });

    var testModelInstance = new TestModel();

    ok(testModelInstance.mixin1Initialized);
});

test("Base class initialize works when mixin does not contain initialize method", function() {
    var TestMixin = {
       run: function() {
           this.wasRun = true;
       }
    };
    var TestRouter = Brace.Router.extend({
        mixins: [TestMixin],
        initialize: function() {
            this.run();
        }
    });

    var instance = new TestRouter();

    ok(instance.wasRun, "Error mixing in initialize method");
});

test("Class initialize is called when mixin initialize is specified", function() {
    var TestMixin = {
        initialize: function() {
            this.myMixinHas = "beenCalled";
        }
    };

    var TestMixin2 = {
        initialize: function() {
            this.myMixin2Has = "beenCalled";
        }
    };

    var TestModel = Brace.Model.extend({
        mixins: [TestMixin, TestMixin2],
        initialize: function() {
            this.classInitializeHas = "beenCalled";
        }
    });
    var testModelInstance = new TestModel();

    equals(testModelInstance.myMixinHas, "beenCalled");
    equals(testModelInstance.myMixin2Has, "beenCalled");
    equals(testModelInstance.classInitializeHas, "beenCalled");
});

test("Mixin defaults compose with class defaults", function() {
    var TestMixin = {
        defaults: {
            yada: "yada"
        }
    };

    var TestModel = Brace.Model.extend({
        mixins: [TestMixin],
        defaults: {
            blah: "blah"
        }
    });

    deepEqual(TestModel.prototype.defaults, {
        blah: "blah",
        yada: "yada"
    });
});

test("Mixin defaults replace class defaults if class has no defaults specified", function() {
    var TestMixin = {
        defaults: {
            yada: "yada"
        }
    };

    var TestModel = Brace.Model.extend({
        mixins: [TestMixin]
    });

    deepEqual(TestModel.prototype.defaults, {
        yada: "yada"
    });
});

test("Mixin validate is mixed in when class does not contain validate method", function() {
    var TestMixin = {
        validate: function() {
            this.mixin1Validated = true;
        }
    };
    var TestModel = Brace.Model.extend({
        mixins: [TestMixin]
    });

    var testModelInstance = new TestModel();
    testModelInstance.set({}); // cause validation

    ok(testModelInstance.mixin1Validated);
});

test("Validate is composed in multiple mixins", function() {
    var TestMixin1 = {
        validate: function() {
            this.mixin1Validated = true;
        }
    };
    var TestMixin2 = {
        validate: function() {
            this.mixin2Validated = true;
        }
    };
    var TestModel = Brace.Model.extend({
        mixins: [TestMixin1, TestMixin2],
        validate: function() {
            this.modelValidated = true;
        }
    });

    var testModelInstance = new TestModel();
    testModelInstance.set({}); // cause validation

    ok(testModelInstance.mixin1Validated);
    ok(testModelInstance.mixin2Validated);
    ok(testModelInstance.modelValidated);
});

test("When a mixin's validate function fails, it is returned before the original function", function() {
    var TestMixin = {
        validate: function() {
            return "you suck!";
        }
    };
    var TestModel = Brace.Model.extend({
        mixins: [TestMixin]
    });

    var called = false;
    var testModelInstance = new TestModel();
    testModelInstance.set({}, {
        error: function(ctx, error) {
            called = true;
            equal(error, "you suck!");
        }
    });

    ok(called);
});

test("Attributes Mixin", function () {

    var ContactModel = Brace.Model.extend({
        namedAttributes: ["name", "number", "address"]
    });

    var myContactModel = new ContactModel({
        name: "scott",
        number: 412947430
    });

    equals("scott", myContactModel.getName());
    equals(412947430, myContactModel.getNumber());

    myContactModel.setName("jonothan");
    myContactModel.setNumber(0);


    equals("jonothan", myContactModel.getName());
    equals(0, myContactModel.getNumber());
});


test("Attributes Mixin passes options to underlying set", function () {

    var ContactModel = Brace.Model.extend({
        namedAttributes: ["name", "number", "address"]
    });

    var myContactModel = new ContactModel({
        name: "scott",
        number: 412947430
    });

    var triggered;
    myContactModel.on("change:name", function() {
        triggered = true;
    });

    myContactModel.setName("jonothan");
    myContactModel.setNumber(0);

    ok(triggered, "Event trigged after set");
    triggered = false;

    myContactModel.setName("jared", {silent: true});

    ok(!triggered, "Event not trigged with silent passed to set");

    myContactModel.set("name", "jared", {silent: true});

    ok(!triggered, "Event not trigged with silent passed to set");

    myContactModel.set({
       name: "jared"
    }, {silent: true});

    ok(!triggered, "Event not trigged with silent passed to set");
});

test("Order of composed initialize method", function() {
    var addToTestArray = function(val) {
        this.callOrder = this.callOrder || [];
        this.callOrder.push(val);
    };
    var mixin1 = {
        initialize: function() {
            addToTestArray.call(this, 1);
        }
    };
    var mixin2 = {
        initialize: function() {
            addToTestArray.call(this, 2);
        }
    };

    // Test mixins with base class initialize
    var ModelA = Brace.Model.extend({
        mixins: [mixin1, mixin2],
        initialize: function() {
            addToTestArray.call(this, 0);
        }
    });
    deepEqual(new ModelA().callOrder, [0, 1, 2], 'Initialize order when base class defines initialize');

    // Test mixins without base class initialize
    var ModelB = Brace.Model.extend({
        mixins: [mixin2, mixin1]
    });
    deepEqual(new ModelB().callOrder, [2, 1], 'Initialize order when base class does not define initialize');
});

test("Order of composed validate method", function() {
    var addToTestArray = function(val) {
        this.callOrder = this.callOrder || [];
        this.callOrder.push(val);
    };
    var passingValidatorMixin = {
        validate: function() {
            addToTestArray.call(this, 'passedMixin');
        }
    };
    var failingValidatorMixin = {
        validate: function() {
            addToTestArray.call(this, 'failedMixin');
            return 'failed';
        }
    };

    // Test that model validate called before mixin validate; mixin validate not called if model validate fails
    var FailingValidationModel = Brace.Model.extend({
        mixins: [passingValidatorMixin],
        validate: function() {
            addToTestArray.call(this, 'failedModel');
            return 'failed';
        }
    });
    var failingModel = new FailingValidationModel();
    failingModel.set('a', 'property');
    deepEqual(failingModel.callOrder, ['failedModel']);

    // Test that model validate called before mixin validate
    var PassingValidationModel = Brace.Model.extend({
        mixins: [passingValidatorMixin, failingValidatorMixin],
        validate: function() {
            addToTestArray.call(this, 'passedModel');
        }
    });
    var passingModel = new PassingValidationModel();
    passingModel.set('a', 'property');
    deepEqual(passingModel.callOrder, ['passedModel', 'passedMixin', 'failedMixin']);
});
