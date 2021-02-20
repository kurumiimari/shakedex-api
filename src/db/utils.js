function paramOrdinals(params) {
  return params.map((_, i) => `$${i + 1}`).join(', ');
}
exports.paramOrdinals = paramOrdinals