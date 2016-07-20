
module("Brace.EventsMixinCreator");

test("On and trigger are added to model", function() {
    var MaleModel = Brace.Model.extend({
        namedEvents: ["think"]
    });

    var zoolander = new MaleModel();

    ok(zoolander.onThink);
    ok(zoolander.triggerThink);

    var triggered = false;
    var handler = function() {
        triggered = true;
    };
    zoolander.onThink(handler);

    zoolander.triggerThink();
    ok(triggered);
});

test("namedEvents array is not removed from model instance", function() {
    var MaleModel = Brace.Model.extend({
        namedEvents: ["think"]
    });

    var hansel = new MaleModel();
    deepEqual(hansel.namedEvents, ["think"]);
});

test("Binding when no events specified succeeds", function() {
    var MaleModel = Brace.Model.extend();

    var hansel = new MaleModel();
    hansel.on("derelique");
});

test("Triggering when no events specified succeeds", function() {
    var MaleModel = Brace.Model.extend();

    var hansel = new MaleModel();
    hansel.trigger("derelique");
});

test("Mixin can apply events to model with no events", function() {
    var MyMixin = {
        namedEvents: ["someEvent"]
    };
    var MyModel = Brace.Model.extend({
        mixins: [MyMixin]
    });
    var myModel = new MyModel();
    deepEqual(myModel.namedEvents, ["someEvent"]);
    ok(myModel.onSomeEvent);
    ok(myModel.triggerSomeEvent);
});

test("Mixin can apply events to model with some events", function() {
    var MyMixin = {
        namedEvents: ["someEvent"]
    };
    var MyModel = Brace.Model.extend({
        mixins: [MyMixin],
        namedEvents: ["someOtherEvent"]
    });
    var myModel = new MyModel();
    deepEqual(myModel.namedEvents, ["someOtherEvent", "someEvent"]);
    ok(myModel.onSomeOtherEvent);
    ok(myModel.triggerSomeOtherEvent);
    ok(myModel.onSomeEvent);
    ok(myModel.triggerSomeEvent);
});

test("Children inherit their parents namedEvents", function() {
    var MyParentModel = Brace.Model.extend({
        namedEvents: ["someEvent"]
    });
    var MyModel = MyParentModel.extend({
        namedEvents: ["someOtherEvent"]
    });
    var myModel = new MyModel();

    var actual = myModel.namedEvents.slice();
    var expected = ["someOtherEvent", "someEvent"];

    // order doesn't matter
    actual.sort();
    expected.sort();

    deepEqual(actual, expected);
    ok(myModel.onSomeOtherEvent);
    ok(myModel.triggerSomeOtherEvent);
    ok(myModel.onSomeEvent);
    ok(myModel.triggerSomeEvent);
});

test("Children inherit their ancestors namedEvents", function() {
    var MyParentParentModel = Brace.Model.extend({
        namedEvents: ["someEvent"]
    });
    var MyParentModel = MyParentParentModel.extend();
    var MyModel = MyParentModel.extend({
        namedEvents: ["someOtherEvent"]
    });
    var myModel = new MyModel();

    var actual = myModel.namedEvents.slice();
    var expected = ["someOtherEvent", "someEvent"];

    // order doesn't matter
    actual.sort();
    expected.sort();

    deepEqual(actual, expected);
    ok(myModel.onSomeOtherEvent);
    ok(myModel.triggerSomeOtherEvent);
    ok(myModel.onSomeEvent);
    ok(myModel.triggerSomeEvent);
});

test("Children inherit their parents and ancestors namedEvents", function() {
    var MyParentParentModel = Brace.Model.extend({
        namedEvents: ["someEvent"]
    });
    var MyParentModel = MyParentParentModel.extend({
        namedEvents: ["someKindOfEvent"]
    });
    var MyModel = MyParentModel.extend({
        namedEvents: ["someOtherEvent"]
    });
    var myModel = new MyModel();

    var actual = myModel.namedEvents.slice();
    var expected = ["someOtherEvent", "someKindOfEvent", "someEvent"];

    // order doesn't matter
    actual.sort();
    expected.sort();

    deepEqual(actual, expected);
    ok(myModel.onSomeOtherEvent);
    ok(myModel.triggerSomeOtherEvent);
    ok(myModel.onSomeKindOfEvent);
    ok(myModel.triggerSomeKindOfEvent);
    ok(myModel.onSomeEvent);
    ok(myModel.triggerSomeEvent);
});

