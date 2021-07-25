# path-normalizer

A tool to parse absolute SVG paths and normalize them. Accompanies my blog article, part of a series, on SVG paths. **Right now this code works only with absolute paths.**

## Using this code

First, `require()` `PathParser` and `NormalizedPath` at the top of your code. Then construct a new `NormalizedPath` object with a descriptor as a string like so:

```
const testNormalizedPath = new NormalizedPath( "M 300 300 A 50 50 90 1 1 400 300 A 50 50 90 1 1 300 300 z" )
console.log( testNormalizedPath.toString() )
--> M 300 300 C 300,272.4042487753,322.4042487753,250,350,250 377.5957512247,250,400,272.4042487753,400,300 C 400,327.5957512247,377.5957512247,350,350,350 322.4042487753,350,300,327.5957512247,300,300 Z
```

Use the included cli with `yarn test "<path descriptor>"` or `npm test "<path descriptor>"`.