const {SwapProof} = require('shakedex/src/swapProof.js');
const {ValidationError} = require('./errors.js');
const jsonSchemaValidate = require('jsonschema').validate;
const {container} = require('../container.js');

const {addressRegex} = require('./validation.js');
const {hexRegex} = require('./validation.js');
const {AUCTION_SORT_FIELDS} = require('../db/auctions.js');

const auctionSchema = {
  type: 'object',
  required: [
    'name',
    'lockingTxHash',
    'lockingOutputIdx',
    'publicKey',
    'paymentAddr',
    'data',
  ],
  properties: {
    name: {
      type: 'string',
    },
    lockingTxHash: {
      type: 'string',
      pattern: hexRegex(64),
    },
    lockingOutputIdx: {
      type: 'integer',
      minimum: 0,
    },
    publicKey: {
      type: 'string',
      pattern: hexRegex(66),
    },
    paymentAddr: {
      type: 'string',
      pattern: addressRegex,
    },
    data: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: [
          'price',
          'lockTime',
          'signature',
        ],
        properties: {
          price: {
            type: 'integer',
            minimum: 0,
          },
          lockTime: {
            type: 'integer',
            minimum: 1610000000,
          },
          signature: {
            type: 'string',
            pattern: hexRegex(130),
          },
        },
      },
    },
  },
};

const filtersSchema = {
  type: 'object',
  properties: {
    includePunycode: {
      type: 'boolean',
    },
    includeAscii: {
      type: 'boolean',
    },
    minLength: {
      type: 'number',
    },
    maxLength: {
      type: 'number',
    },
    minCurrentBid: {
      type: 'number',
    },
    maxCurrentBid: {
      type: 'number',
    },
    statuses: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['COMPLETED', 'CANCELLED', 'ACTIVE'],
      },
    },
    before: {
      type: 'number',
    },
    after: {
      type: 'number',
    },
  },
};

class AuctionService {
  constructor(auctionsDb, sdContext) {
    this.auctionsDb = auctionsDb;
    this.sdContext = sdContext;
  }

  async validateAuction(auction) {
    if (!auction) {
      throw new ValidationError('Must specify an auction key.');
    }

    const res = jsonSchemaValidate(auction, auctionSchema);
    if (!res.valid) {
      throw new ValidationError('Invalid auction schema.');
    }

    const exists = await this.auctionsDb.auctionExists(auction.lockingTxHash, auction.lockingOutputIdx);
    if (exists) {
      throw new ValidationError('Auction already exists.');
    }
    const proofs = auction.data.map(a => new SwapProof({
      name: auction.name,
      lockingTxHash: auction.lockingTxHash,
      lockingOutputIdx: auction.lockingOutputIdx,
      publicKey: auction.publicKey,
      paymentAddr: auction.paymentAddr,
      price: a.price,
      lockTime: a.lockTime,
      signature: a.signature,
    }));

    for (const proof of proofs) {
      const ok = await proof.verify(this.sdContext);
      if (!ok) {
        throw new ValidationError('Swap proofs failed validation.');
      }
    }
  }

  async createAuction(auction, signature) {
    await this.validateAuction(auction, signature);
    return this.auctionsDb.saveAuction(auction, signature);
  }

  async getAuctions(page = 1, perPage = 25, search = null, filters = null, sortField = null, sortDirection = 1) {
    page = Number(page);
    perPage = Number(perPage);
    if (isNaN(page)) {
      throw new ValidationError('Page must be a number.');
    }
    if (isNaN(perPage)) {
      throw new ValidationError('Per page must be a number.');
    }

    if (filters) {
      this.validateFilters(filters);
    }
    if (sortField && !AUCTION_SORT_FIELDS[sortField]) {
      throw new ValidationError('Invalid sort field.');
    }
    sortDirection = Number(sortDirection);
    if (sortDirection && sortDirection !== -1 && sortDirection !== 1) {
      throw new ValidationError('Invalid sort direction.');
    }

    page = Math.max(1, page);
    perPage = Math.min(Math.max(0, perPage), 50);
    return this.auctionsDb.getAuctions(page, perPage, search, filters, sortField, sortDirection);
  }

  async getAuction(auctionId) {
    auctionId = Number(auctionId);
    if (isNaN(auctionId)) {
      throw new ValidationError('Auction ID must be a number.');
    }

    return this.auctionsDb.getAuction(auctionId);
  }

  async getAuctionByName(name) {
    if (typeof name !== 'string') {
      throw new ValidationError('Name must be a string.');
    }

    return this.auctionsDb.getAuctionByName(name);
  }

  validateFilters(filters) {
    const res = jsonSchemaValidate(filters, filtersSchema);
    if (!res.valid) {
      throw new ValidationError('Invalid filters.');
    }

    if (filters.minLength && filters.maxLength && filters.minLength > filters.maxLength) {
      throw new ValidationError('Cannot specify a min length that is larger then the max length.');
    }

    if (Number.isInteger(filters.minCurrentBid) && Number.isInteger(filters.maxCurrentBid) &&
      filters.minCurrentBid > filters.maxCurrentBid) {
      throw new ValidationError('Min current bid cannot exceed max current bid.');
    }

    if (filters.before && filters.after && filters.before > filters.after) {
      throw new ValidationError('Cannot specify a before date that comes after the after date.');
    }
  }
}

container.register(
  'AuctionService',
  (auctionsDb, sdContext) => new AuctionService(auctionsDb, sdContext),
  ['AuctionsDB', 'SDContext'],
);

module.exports = AuctionService;
