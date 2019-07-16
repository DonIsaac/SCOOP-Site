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
