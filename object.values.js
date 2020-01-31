// Object.values polyfill: https://github.com/xpl/es7-object-polyfill/blob/master/es7-object-polyfill.js
var reduce = Function.bind.call(Function.call, Array.prototype.reduce);
var isEnumerable = Function.bind.call(
  Function.call,
  Object.prototype.propertyIsEnumerable
);
var concat = Function.bind.call(Function.call, Array.prototype.concat);

if (!Object.values) {
  Object.values = function values(O) {
    return reduce(
      ownKeys(O),
      function(v, k) {
        return concat(
          v,
          typeof k === "string" && isEnumerable(O, k) ? [O[k]] : []
        );
      },
      []
    );
  };
}
