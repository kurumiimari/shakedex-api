exports.hexRegex = (len = null) => {
  return new RegExp(`^[a-f0-9]${len ? `{${len}}` : '+'}$`);
}

exports.addressRegex = /^(hs|rs|ts|ss)1[a-zA-HJ-NP-Z0-9]{25,39}$/i