
module('Brace.Mixins');

test("CreateMethodName", function() {
    equal(Brace.Mixins.createMethodName("blah", "blah"), "blahBlah");
    equal(Brace.Mixins.createMethodName("blah", "_lah"), "blah_lah");
});

