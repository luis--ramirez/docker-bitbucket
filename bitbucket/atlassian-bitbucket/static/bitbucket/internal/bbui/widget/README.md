# bitbucket-widget

> Lifecycled widget for Bitbucket

## Usage

To use the bitbucket widget, you'll want to inherit from it when creating your class.

ES6:

```js
class MyWidget extends BitbucketWidget {
    constructor (options) {
        super(options);
        ...
    }
    myMethod () { ... }
}
MyWidget.defaults = { foo: 'foo' };

// A common pattern for widgets is to pass in a HTMLElement to the constructor of a widget.
// In this case, you only pass along the `options` to the `super()` method and you 
// *must* provide a constructor method in your class because the default constructor 
// will pass along all arguments to `super()`
class MyWidget extends BitbucketWidget {
    constructor (el, options) {
        super(options);
        this.$el = $(el);
    }
}
```

ES5:

```js
function MyWidget(options){ 
    BitbucketWidget.call(this, options);
}
MyWidget.prototype = Object.create(BitbucketWidget.prototype);
MyWidget.prototype.constructor = MyWidget;

MyWidget.defaults = { ... };
MyWidget.prototype.myMethod = function () { ... };
```

### Function binding

Note that because BitbucketWidget does a bindAll in its constructor, there is no need to manually bind
prototype methods of child classes.

