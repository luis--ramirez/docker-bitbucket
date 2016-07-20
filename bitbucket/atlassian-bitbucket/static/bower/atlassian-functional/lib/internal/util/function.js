define('internal/util/function', [
    'lodash',
    'exports'
],
function(
    _,
    exports
    ) {

    'use strict';

    var slice = Array.prototype.slice;

    /**
     * Takes any number of predicate functions and returns a function that returns true if all the predicates return true
     *
     * @param {...Function} predicates - The predicate functions to combine
     *
     * @example
     * var isPositive = function(a){ return a > 0; }
     * var isEven = function(a){ return a % 2 === 0; }
     * var isPositiveAndEven = and(isPositive, isEven)
     *
     * isPositiveAndEven(2)     // => true
     * isPositiveAndEven(1)     // => false
     * isPositiveAndEven(-2)    // => false
     *
     * @returns {Function}
     */
    function and(/*predicates*/){
        var predicates = slice.call(arguments);

        return function(/*arguments*/){
            return predicates.every(lazyApply(arguments));
        };
    }


    /**
     * Invokes a list of functions with a given set of arguments.
     *
     * @param {Array<function>} list - list of functions
     * @param {Array} args - list of arguments to apply
     * @returns {Array} the results of applying args to each function
     */
    function applyAll(list, args) {
        return list.map(lazyApply.call(this, args));
    }

    /**
     * Limit the number of arguments passed to a function.
     * Used to trim off extra arguments from collection methods like `map` and `forEach`
     * @param {Function} fn
     * @param {number} numArgs
     *
     * @example
     *     fn.arity(function(){return arguments}, 2)(1,2,3) // => [1, 2]
     *
     * @returns {Function}
     */
    function arity(fn, numArgs) {
        return argSlice(fn, 0, numArgs);
    }

    /**
     * Reverses the order of the function parameters
     * @param {Function} fn
     *
     * @example
     * fn.argFlip(function(){return arguments})(1,2,3) //=> [3, 2, 1]
     *
     * @returns {Function}
     */
    function argFlip(fn) {
        return function() {
            return fn.apply(this, slice.call(arguments).reverse());
        };
    }

    /**
     * Map incoming arguments to the desired order for `fn`.
     * @param {Function} fn
     *
     * @example
     *      fn.argMap(function(){return arguments}, 2,0,1)('a','b','c') // => ['c','a','b']
     *
     * @returns {Function}
     */
    function argMap(fn /*, arg positions*/){
        var argPositions = slice.call(arguments, 1);

        return function(){
            return fn.apply(this, argPositions.map(lookup(arguments)));
        };
    }

    /**
     * Pick a subset of the arguments to pass to a function.
     * Similar to arity but doesn't need to start at the first element
     *
     * @param {Function} fn
     * @param {number} start - The index of the first argument (inclusive). Defaults to 0
     * @param {number} end - The index of the last argument (exclusive). Defaults to arguments.length
     *
     * @example
     *      fn.argSlice(function(){return arguments}, 1)(1,2,3,4) // => [2, 3, 4]
     *      fn.argSlice(function(){return arguments}, 1, 3)(1,2,3,4) // => [2, 3]
     *
     * @returns {Function}
     */
    function argSlice(fn, start, end) {
        return function(){
            return fn.apply(this, slice.call(arguments, start, end));
        };
    }

    /**
     * Returned a function that when called _always_ returns the original argument.
     * @param {*} arg
     *
     * @example
     * ['a', 'b', 'c'].map(fn.constant('x')) // => ['x', 'x', 'x']
     *
     * @returns {Function}
     */
    function constant(arg) {
        return function() {
            return arg;
        };
    }

    /**
     * Returns a function that when called will create a new instance of Clazz with the provided args
     *
     * @example
     * ['Repo1','Repo2'].map(fn.create(Repository)) // => [new Repository('Repo1'), new Repository('Repo2')]
     *
     * @param Clazz
     * @returns {Function}
     */
    function create(Clazz) {
        return function ctor() {
            var o = Object.create(Clazz.prototype);
            var ret = Clazz.apply(o, arguments);
            return ret !== null && typeof ret === 'object' ? ret : o; // if an object value is returned, use that instead.
        };
    }

    /**
     * Return a function that when called with argument A, will return a default value if A is undefined or null, otherwise
     * will return A.
     * @param {*} theDefault
     *
     * @example
     * ['foo', 'bar', null, 'bar'].map(fn.defaultValue('foo')) // => ['foo', 'bar', 'foo', 'bar']
     *
     * @returns {Function}
     */
    function defaultValue(theDefault) {
        return function(a) {
            return a != null ? a : theDefault;
        };
    }

    /**
     * Get a property from a lazy object.
     * Basically a more generic version of _.pluck.
     * Supports '.' separated keypaths e.g. 'user.avatar.size'
     * Has null safety for keypaths (will return undefined if the keypath is invalid rather than throwing an exception)
     * @param {string} keyPath
     *
     * @example
     * var values = [{a: 'b'}, {a: 'c'}]
     *
     * values.map(fn.dot('a')) //=> ['b', 'c']
     * values.map(_.compose(fn.eq('b'), fn.dot('a'))) // => [true, false]
     *
     *
     * var obj = { my: { nested : { prop : 'foo' } } };
     * dot('my.nested.prop')(obj)    // => 'foo'
     * dot('my.invalid.prop')(obj)   // => undefined //invalid key path
     *
     * @returns {Function}
     */
    function dot(keyPath) {
        var keyParts = keyPath.split('.');
        return function(object) {
            return keyParts.reduce(function(obj, propName) {
                return (obj != null) ? obj[propName] : undefined;
            }, object);
        };
    }

    /**
     * Shorthand for the very common pairing of `dot` and `eq`
     *
     * @param {string} keyPath - The property name to compare
     * @param {*} value - The value to compare to
     *
     * @example
     * var values = [{a: 1}, {a: 2}]
     *
     * values.filter(fn.dotEq('a', 1)) //=> [{a: 1}]
     *
     * @returns {Function}
     */
    function dotEq(keyPath, value) {
        return _.compose(eq(value), dot(keyPath));
    }

    /**
     * Similar to invoke, but whereas invoke explicitly calls a function and returns undefined if the property is not one,
     * dotX says that if the matched property is a function, eXecute it (with supplied args), otherwise return the property
     * Basically a conditional dot + invoke
     * Supports keypaths with null safety
     *
     * @param {string} keyPath
     *
     * @example
     * dotX('myFunc')({myFunc: fn.constant('foo')})  // => 'foo'
     *
     * var obj = { my: { nested : { prop1 : 'foo', prop2: fn.constant('bar') } } };
     * dotX('my.nested.prop1')(obj)  // => 'foo'
     * dotX('my.nested.prop2')(obj)  // => 'bar'
     * dotX('my.invalid.prop')(obj)  // => undefined //invalid key path
     *
     * @returns {Function}
     */
    function dotX(keyPath/*, args*/) {
        var args = slice.call(arguments, 1);
        var propDot = dot(keyPath);
        var selfDot = null;
        if (keyPath.indexOf('.') !== -1) {
            selfDot = dot(keyPath.substr(0, keyPath.lastIndexOf('.')));
        }

        return function(object) {
            var prop = propDot(object);
            if (selfDot) {
                object = selfDot(object);
            }

            return (typeof prop === 'function') ? prop.apply(object, args) : prop;
        };
    }

    /**
     * Curried form of strict equals.
     * @param {*} a
     *
     * @example
     * ['a', 'b', 'c'].map(fn.eq('a')) // => [true, false, false]
     *
     * @returns {Function}
     */
    function eq(a) {
        return function(b) {
            return a === b;
        };
    }

    /**
     * Wrapper for an `indexOf` type function that converts the result into a `found` boolean
     *
     * @param {Function} fn
     *
     * var myArray = [1,2,3,4];
     * var foundInArray = found(myArray.indexOf.bind(myArray));
     * foundInArray(1) // => true
     * foundInArray(4) // => true
     * foundInArray(5) // => false
     *
     * @returns {Function}
     */
    function found(fn){
        return function(/*arguments*/) {
            var index = fn.apply(this, arguments);

            return index >= 0;
        };
    }

    /**
     * Curried form of _.invoke that works with a single object.
     * Useful when you are mapping over a collection and you want to call a method on each object that returns a value.
     * Similar to `.map('.method')` in Bacon.
     * Explicitly requires that the property is a function or throws a type error
     * Also supports keypaths with null safety like fn.dot, however as mentioned above, if the final output of the
     * keypath is undefined, invoke will throw a type error.
     *
     * @param {string} methodPath
     *
     * @example
     * [{isTrue: fn.constant(false)}, {isTrue: fn.constant(true)}].map(fn.invoke('isTrue')) // => [false, true]
     *
     * invoke('some.nested.prop')({some:{nested: {prop: fn.constant('bar')}}}) // => 'bar'
     * invoke('some.nested.prop')({some:{nested: {prop: 'bar'}}}) // => Throws TypeError
     * invoke('some.invalid.prop')({some:{nested: {prop: fn.constant('bar')}}}) // => Throws TypeError
     *
     * @returns {Function}
     */
    function invoke(methodPath/*, args*/) {
        var args = slice.call(arguments, 1);

        return function(object) {
            var fn = dot(methodPath)(object);
            var context = (methodPath.indexOf('.') !== -1) ? dot(methodPath.substr(0, methodPath.lastIndexOf('.')))(object) : object;

            if (typeof fn !== 'function') {
                throw new TypeError(fn + ' is not a function');
            }

            return fn.apply(context, args);
        };
    }

    /**
     * Returns a function that will apply the arguments to another function that is passed in.
     * The use-case is usually related to mapping over a list of functions.
     *
     * @param {Array} args - array of arguments to apply
     * @returns {Function}
     */
    function lazyApply(args) {
        return function(fn) {
            // Function.prototype.apply.call should work, but doesn't. :(
            return fn.apply(this, args);
        };
    }

    /**
     * Returns a function whose execution will be delayed by the specified wait time
     * Lazy version of _.delay
     *
     * @param {Function} fn
     * @param {number} wait - Wait time in ms
     */
    function lazyDelay(fn, wait) {
        return function(/*args*/){
            var args = slice.call(arguments);
            var self = this;

            setTimeout(function(){ fn.apply(self, args); }, wait);
        };
    }

    /**
     * The inverse of {@link dot}. Takes an object and returns a function for looking up keys in that object.
     * @param {Object} map - object to lookup properties within.
     *
     * @example
     * var myObj = {foo: 'bar', x:'y'};
     *
     * ['foo', 'x'].map(lookup(myObj)) //=> ['bar', 'y']
     *
     * @returns {Function}
     */
    function lookup(map) {
        return function(key) {
            return map[key];
        };
    }

    /**
     * Curries the application of any function to `!` and some arguments.
     * In other words lazily inverts any function.
     * @param {Function} fn
     *
     * @example
     * ['a', 'b', 'c'].map(fn.not(fn.eq('a'))) //=> [false, true, true]
     *
     * @returns {Function}
     */
    function not(fn) {
        return function(/*arguments*/) {
            return !fn.apply(this, arguments);
        };
    }

    /**
     * Takes any number of predicate functions and returns a function that returns true if any of the predicates return true
     *
     * @param {...Function} predicates - The predicate functions to combine
     *
     * @example
     * var isPositive = function(a){ return a > 0; }
     * var isEven = function(a){ return a % 2 === 0; }
     * var isPositiveOrEven = or(isPositive, isEven)
     *
     * isPositiveOrEven(2)     // => true
     * isPositiveOrEven(1)     // => true
     * isPositiveOrEven(-2)    // => true
     * isPositiveOrEven(-1)    // => false
     *
     * @returns {Function}
     */
    function or(/*predicates*/){
        var predicates = slice.call(arguments);

        return function(/*arguments*/){
            return predicates.some(lazyApply(arguments));
        };
    }

    /**
     * Partially apply from the right rather than the left
     * @param {Function} fn
     *
     * @example
     * fn.partialRight(function(){return arguments}, 3, 4)(1, 2) //=> [1, 2, 3, 4]
     *
     * @returns {Function}
     */
    function partialRight(fn /*, arguments*/) {
        var partialArgs = slice.call(arguments, 1);

        return function(){
            return fn.apply(this, slice.call(arguments).concat(partialArgs));
        };
    }


    /**
     * Return a function that will compare each property on the input to the same property on a descriptor object.
     * Like _.where, but for a single item instead of a collection.
     *
     * @param {object} description
     *
     * @example
     * var myObj = {a: 1, b: 2, c: 3 }
     * fn.propEqual({a:1, c:3})(myObj) //=> true
     *
     * @returns {function(object): boolean}
     */
    function propEqual(description) {
        // map the description object properties to dotEq(key, value);
        var comparators = _.map(description, argMap(dotEq, 1, 0));

        // returned function will check whether every property compares equally
        return and.apply(null, comparators);
    }

    /**
     * Lazily set the value on an object for a given keyPath.
     * Supports '.' separated keyPaths
     * Optionally creates the keyPath as necessary.
     *
     * @param {string} keyPath
     * @param {*} value
     * @param {boolean?} shouldCreatePath - Should `set` augment the object to satisfy the keyPath or should it throw a type error on invalid keyPaths?
     *
     * @example
     * var simple = {};
     * set('test', 123)(simple) //=> simple == {test: 123}
     *
     * var deep = {one: { two: { three: 3}}};
     * set('one.two.four', 4)(deep) //=> deep == {one: { two: { three: 3, four: 4}}}
     *
     * var deepEmpty = {}
     * set('one.two.four', 4)(deepEmpty) //=> TypeError
     * set('one.two.four', 4, true)(deepEmpty) //=> deepEmpty == {one: { two: { four: 4}}}
     *
     * @returns {Function}
     */
    function set(keyPath, value, shouldCreatePath) {
        var keyParts = keyPath.split('.');
        var last = keyParts.pop();

        /**
         * @param {object} object
         * @returns {object}
         */
        return function(object){
            keyParts.reduce(function(obj, propName) {
                if (obj[propName] != null && typeof obj[propName] !== 'object') {
                    throw new TypeError("Can't set property on non-object");
                }

                return (obj[propName] == null && shouldCreatePath) ? obj[propName] = {} : obj[propName];
            }, object)[last] = value;

            return object;
        };
    }

    /**
     * Return a function that will call the passed function with one of the incoming arguments spread out (if it's an array).
     * @param {Function} intoFn - the function to call with spread arguments
     * @param {number} [index=0] - the index of the parameter to spread
     *
     * @example
     * var varFunc = spread(func, 2);
     *
     * varFunc(1,2,[3,4],5) === func(1,2,3,4,5)
     * varFunc(1,2,3,4,5) === func(1,2,3,4,5)
     *
     * @returns {Function}
     */
    function spread(intoFn, index) {
        return function() {
            if (arguments.length <= index) {
                return intoFn.apply(this, arguments);
            }

            // arguments.splice(index, 1, ...arguments[index])
            var args = slice.call(arguments);
            args.splice.apply(args, [index || 0, 1].concat(args[ index || 0]));

            return intoFn.apply(this, args);
        };
    }

    /**
     * Map the context of a function call to a param.
     * Mainly used for jQuery which sticks the target element in `this` for callbacks.
     * This way you can `.bind` the callback to a different scope and still have easy access to the target element.
     * It also makes it easier to reuse API methods as handlers.
     * `fn` will be called with `this` as the first param, then the rest of the original arguments
     * @param {Function} fn
     *
     * @example
     * $(document).click(fn.thisToParam(function(){console.log(arguments)})) //=> [document, jQuery.Event]
     *
     * @returns {Function}
     */
    function thisToParam(fn){
        return function(/*arguments*/){
            var args = slice.call(arguments);
            args.unshift(this);
            return fn.apply(this, args);
        };
    }

    exports.and = and;
    exports.applyAll = applyAll;
    exports.arity = arity;
    exports.argFlip = argFlip;
    exports.argMap = argMap;
    exports.argSlice = argSlice;
    exports.constant = constant;
    exports.create = create;
    exports.defaultValue = defaultValue;
    exports.dot = dot;
    exports.dotEq = dotEq;
    exports.dotX = dotX;
    exports.eq = eq;
    exports.found = found;
    exports.invoke = invoke;
    exports.lookup = lookup;
    exports.lazyApply = lazyApply;
    exports.lazyDefer = partialRight(lazyDelay, 1);
    exports.lazyDelay = lazyDelay;
    exports.not = not;
    exports.or = or;
    exports.partialRight = partialRight;
    exports.propEqual = propEqual;
    exports.set = set;
    exports.spread = spread;
    exports.thisToParam = thisToParam;
    exports.unary = partialRight(arity, 1);
    exports.binary = partialRight(arity, 2);
});