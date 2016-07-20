# bitbucket-json-validation

> Validation of JSON shapes.

## Usage

This module lets you validate that a JS object has certain properties that meet certain characteristics (namely that they are of a certain type).

For example:

```js
import validator from 'bitbucket/internal/json-validation';

// validate that something is a string
var stringValidator = validator('string');

stringValidator('passes'); // passes
stringValidator(null);     // THROWS

// validate that something is a nullable number
var nullableNumberValidator = validator('number?');

nullableNumberValidator(null); // passes
nullableNumberValidator(0);    // passes
nullableNumberValidator('0');  // THROWS

//validate an array of numbers
var numbersValidator = validator(['number']);

numbersValidator([0]);      // passes
numbersValidator([]);       // passes
numbersValidator([0, 's']); // THROWS
numbersValidator('s');      // THROWS

// validate complex things, like an array of "fruits"
var validateFruits = validator([{
    freshness: 'number',
    variety: 'string?',
    type: validator.asEnum('FruitType', {
        APPLE: 'APPLE',
        ORANGE: 'ORANGE'
    }),
    source: function(source) { // a function lets you provide custom validation, like string OR farm
        if (typeof source === 'string') return;
        var farmShape = {...};
        validator(farmShape)(source); // throws if source doesn't match a farm shape
    }
}]);

```
