/**
 * Regular #if helper in handlebars only checks if a value exists, this will check if the
 * value of one variable is equal to the value of another variable
 */
module.exports.if_eq = function if_eq(a, b, opts) {
  console.log(a, b)
  if (typeof a === 'string')
    a = a.trim();
  if (typeof b === 'string')
    b = b.trim();
  if (a == b) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
}

/**
 * similar to Integer#times in ruby
 */
module.exports.times = function times(n, block) {
  var accum = '';
  for (var i = 0; i < n; i ++)
    accum += block.fn(i);
  return accum;
}
