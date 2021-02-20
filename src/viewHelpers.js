const {format, formatDistance} = require('date-fns');
module.exports = {
  formatDate: (ts) => {
    return format(new Date(ts), 'MM/dd/yyyy HH:MM:SS OOOO');
  },

  roundCurrency: (amount, showSuffix = true) => {
    let out = Math.floor(amount / 1e6);
    if (showSuffix) {
      out += ' HNS';
    }
    return out;
  },

  currentBid: (bids) => {
    const now = Date.now();
    let currBid = null;
    for (let i = 0; i < bids.length; i++) {
      const bid = bids[i];
      if (bid.lockTime > now) {
        break;
      }
      currBid = bid;
    }

    return currBid;
  },

  fromNow: (ts) => {
    return formatDistance(new Date(ts), new Date())
  },

  ellipsis: (str, len) => {
    if (str.length < len) {
      return str;
    }

    return str.slice(0, len) + '...' + str.slice(str.length - len);
  }
};