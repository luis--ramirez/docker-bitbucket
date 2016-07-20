
module("Brace.AttributesMixinCreator");

test("Getter and setter are added to model", function() {
    var MaleModel = Brace.Model.extend({
        namedAttributes: ["look"]
    });

    var zoolander = new MaleModel();

    ok(zoolander.getLook);
    ok(zoolander.setLook);

    zoolander.setLook("Blue Steel");
    equals(zoolander.get("look"), "Blue Steel");

    equals(zoolander.getLook(), "Blue Steel");
});

test("ID attribute is always added to namedAttributes", function() {
    var MaleModel = Brace.Model.extend({
        namedAttributes: ["look"]
    });

    var zoolander = new MaleModel();

    deepEqual(zoolander.namedAttributes, { "id" : null, "look" : null });
    ok(zoolander.getId);
    ok(zoolander.setId);
});

test("Does not barf when user specifies id", function() {
    var MaleModel = Brace.Model.extend({
        namedAttributes: ["id", "look"]
    });

    var zoolander = new MaleModel();

    deepEqual(zoolander.namedAttributes, { "id" : null, "look" : null });
    ok(zoolander.getId);
    ok(zoolander.setId);
});

test("ID attribute is not added if model does not specify namedAttributes", function() {
    var MaleModel = Brace.Model.extend();

    var zoolander = new MaleModel();

    ok(!zoolander.namedAttributes);
    ok(!zoolander.getId);
    ok(!zoolander.setId);
});

test("Setting namedAttributes that does not exist fails", function() {
    var MaleModel = Brace.Model.extend({
        namedAttributes: ["look"]
    });

    var zoolander = new MaleModel();
    raises(function() {
        zoolander.set({
            mer: "man"
        });
    });
});

test("Setting attribute that does not exist fails", function() {
    var MaleModel = Brace.Model.extend({
        namedAttributes: ["look"]
    });

    var zoolander = new MaleModel();
    raises(function() {
        zoolander.set("mer", "man");
    });
});

test("Getting attribute that does not exist fails", function() {
    var MaleModel = Brace.Model.extend({
        namedAttributes: ["look"]
    });

    var zoolander = new MaleModel();
    raises(function() {
        zoolander.get("eugooglize");
    });
});

test("Default set and get work", function() {
    var MaleModel = Brace.Model.extend({
        namedAttributes: ["look"]
    });

    var zoolander = new MaleModel();
    zoolander.set("look", "Le Tigre");
    equals(zoolander.get("look"), "Le Tigre");
});

test("Setting any attribute when no property exists succeeds", function() {
    var MaleModel = Brace.Model.extend();

    var hansel = new MaleModel();
    hansel.set("derelique");
});

test("Getting any attribute when no property exists succeeds", function() {
    var MaleModel = Brace.Model.extend();

    var hansel = new MaleModel();
    hansel.get("derelique");
});

test("Mixin can apply namedAttributes to model with no namedAttributes", function() {
    var MyMixin = {
        namedAttributes: ["someAttribute"]
    };
    var MyModel = Brace.Model.extend({
        mixins: [MyMixin]
    });
    var myModel = new MyModel();
    deepEqual(myModel.namedAttributes, { "id" : null, "someAttribute" : null });
    ok(myModel.getSomeAttribute);
    ok(myModel.setSomeAttribute);
});

test("Mixin can apply namedAttributes to model with some namedAttributes", function() {
    var MyMixin = {
        namedAttributes: ["someAttribute"]
    };
    var MyModel = Brace.Model.extend({
        mixins: [MyMixin],
        namedAttributes: ["someOtherAttribute"]
    });
    var myModel = new MyModel();
    deepEqual(myModel.namedAttributes, { "id" : null, "someAttribute" : null, "someOtherAttribute" : null });
    ok(myModel.getSomeOtherAttribute);
    ok(myModel.setSomeOtherAttribute);
    ok(myModel.getSomeAttribute);
    ok(myModel.setSomeAttribute);
});

test("Mixin can apply typed namedAttributes to model with some namedAttributes", function() {
    var MyMixin = {
        namedAttributes: { 
            "someAttribute" : String
        }
    };
    var MyModel = Brace.Model.extend({
        mixins: [MyMixin],
        namedAttributes: ["someOtherAttribute"]
    });
    var myModel = new MyModel();
    deepEqual(myModel.namedAttributes, { "id" : null, "someAttribute" : String, "someOtherAttribute" : null });
    ok(myModel.getSomeOtherAttribute);
    ok(myModel.setSomeOtherAttribute);
    ok(myModel.getSomeAttribute);
    ok(myModel.setSomeAttribute);
});

test("Mixin can apply namedAttributes to model with some typed namedAttributes", function() {
    var MyMixin = {
        namedAttributes: ["someAttribute"]
    };
    var MyModel = Brace.Model.extend({
        mixins: [MyMixin],
        namedAttributes: {
            "someOtherAttribute" : String
        }
    });
    var myModel = new MyModel();
    deepEqual(myModel.namedAttributes, { "id" : null, "someAttribute" : null, "someOtherAttribute" : String });
    ok(myModel.getSomeOtherAttribute);
    ok(myModel.setSomeOtherAttribute);
    ok(myModel.getSomeAttribute);
    ok(myModel.setSomeAttribute);
});

test("Mixin can apply typed namedAttributes to model with some typed namedAttributes", function() {
    var MyMixin = {
        namedAttributes: { 
            "someAttribute" : String
        }
    };
    var MyModel = Brace.Model.extend({
        mixins: [MyMixin],
        namedAttributes: {
            "someOtherAttribute" : String
        }
    });
    var myModel = new MyModel();
    deepEqual(myModel.namedAttributes, { "id" : null, "someAttribute" : String, "someOtherAttribute" : String });
    ok(myModel.getSomeOtherAttribute);
    ok(myModel.setSomeOtherAttribute);
    ok(myModel.getSomeAttribute);
    ok(myModel.setSomeAttribute);
});

test("Mixin with nonconflicting attributes types will pass", function() {
    var mixinAttr5 = Brace.Collection.extend();
    var modelAttr5 = mixinAttr5.extend();
    var modelAttr6 = Brace.Collection.extend();
    var mixinAttr6 = modelAttr6.extend();
    var MixinAttr7 = function() {};
    var ModelAttr7 = function() {};
    ModelAttr7.prototype = new MixinAttr7();
    var MyMixin = {
        namedAttributes: { 
            "someAttribute" : String,
            "attr2" : [ 'string' ],
            "attr3" : Array,
            "attr4" : [],
            "attr5" : mixinAttr5,
            "attr6" : mixinAttr6,
            "attr7" : MixinAttr7
        }
    };
    var MyModel = Brace.Model.extend({
        mixins: [MyMixin],
        namedAttributes: {
            "someAttribute" : String,
            "attr2" : [],
            "attr3" : ['string'],
            "attr4" : [],
            "attr5" : modelAttr5,
            "attr6" : modelAttr6,
            "attr7" : ModelAttr7
        }
    });
    var myModel = new MyModel();
    deepEqual(myModel.namedAttributes, {
        "id" : null,
        "someAttribute" : String,
        "attr2" : [ 'string' ],
        "attr3" : [ 'string' ],
        "attr4" : [],
        "attr5" : modelAttr5,
        "attr6" : mixinAttr6,
        "attr7" : ModelAttr7
    });
    ok(myModel.getSomeAttribute);
    ok(myModel.setSomeAttribute);
});

(function() {
    function conflictedTypesTest(mixinType, modelType) {
        var MyMixin = {
            namedAttributes: { 
                "someAttribute" : mixinType
            }
        };
        raises(function() {
            Brace.Model.extend({
                mixins: [MyMixin],
                namedAttributes: {
                    "someAttribute" : modelType
                }
            });
        });
    }

    test("Mixin with conflicting namedAttributes types will throw", function() {
        conflictedTypesTest(Date, String);
        conflictedTypesTest('number', Number);
        conflictedTypesTest(Backbone.Collection.extend(), Backbone.Collection.extend());
        conflictedTypesTest(Array, Backbone.Collection.extend());
        conflictedTypesTest(['string'], ['number']);
    });
}());

test("Children inherit their parents namedAttributes", function() {
    var MyParentModel = Brace.Model.extend({
        namedAttributes: ["someAttribute"]
    });
    var MyModel = MyParentModel.extend({
        namedAttributes: ["someOtherAttribute"]
    });
    var myModel = new MyModel();

    var actual = myModel.namedAttributes;
    var expected = { "id": null, "someOtherAttribute": null, "someAttribute": null};

    deepEqual(actual, expected);
    ok(myModel.getSomeOtherAttribute);
    ok(myModel.setSomeOtherAttribute);
    ok(myModel.getSomeAttribute);
    ok(myModel.setSomeAttribute);
});

test("Children inherit their ancestors namedAttributes", function() {
    var MyParentParentModel = Brace.Model.extend({
        namedAttributes: ["someAttribute"]
    });
    var MyParentModel = MyParentParentModel.extend();
    var MyModel = MyParentModel.extend({
        namedAttributes: ["someOtherAttribute"]
    });
    var myModel = new MyModel();

    var actual = myModel.namedAttributes;
    var expected = { "id": null, "someOtherAttribute": null, "someAttribute": null};

    deepEqual(actual, expected);
    ok(myModel.getSomeOtherAttribute);
    ok(myModel.setSomeOtherAttribute);
    ok(myModel.getSomeAttribute);
    ok(myModel.setSomeAttribute);
});

test("Children inherit their parents and ancestors namedAttributes", function() {
    var MyParentParentModel = Brace.Model.extend({
        namedAttributes: ["someAttribute"]
    });
    var MyParentModel = MyParentParentModel.extend({
        namedAttributes: ["someKindOfAttribute"]
    });
    var MyModel = MyParentModel.extend({
        namedAttributes: ["someOtherAttribute"]
    });
    var myModel = new MyModel();

    var actual = myModel.namedAttributes;
    var expected = { "id": null, "someKindOfAttribute": null, "someOtherAttribute": null, "someAttribute": null};

    deepEqual(actual, expected);
    ok(myModel.getSomeOtherAttribute);
    ok(myModel.setSomeOtherAttribute);
    ok(myModel.getSomeKindOfAttribute);
    ok(myModel.setSomeKindOfAttribute);
    ok(myModel.getSomeAttribute);
    ok(myModel.setSomeAttribute);
});

