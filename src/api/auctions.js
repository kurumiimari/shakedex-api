const {ValidationError} = require('../service/errors.js');
const {container} = require('../container.js');
const viewHelpers = require('../viewHelpers.js');
const {SwapProof, writeProofStream} = require('shakedex/src/swapProof.js');

module.exports = {
  'GET /': async (req, res) => {
    const auctionService = await container.resolve('AuctionService');
    const {auctions, total} = await auctionService.getAuctions(1, 25);

    res.render('auctions/index', {
      title: 'Auctions',
      auctions,
      total,
      totalPages: Math.ceil(total / 25),
      currentPage: 1,
      viewHelpers,
    });
  },
  'GET /auctions/:auction_id': async (req, res) => {
    const auctionService = await container.resolve('AuctionService');
    const auction = await auctionService.getAuction(req.params.auction_id);
    res.render('auctions/show', {
      title: `Auction &raquo; ${auction.name}`,
      auction,
      viewHelpers,
    });
  },
  'POST /api/v1/auctions': async (req, res) => {
    if (!req.body) {
      throw new ValidationError('Must define a request body.');
    }

    const auctionService = await container.resolve('AuctionService');
    const auction = await auctionService.createAuction(
      req.body.auction,
    );
    res.status(200);
    res.json(auction);
  },
  'GET /api/v1/auctions': async (req, res) => {
    const {page, per_page: perPage, search, sort_field: sortField, sort_direction: sortDirection} = req.query;
    let filters = req.query.filters;
    if (filters) {
      try {
        filters = JSON.parse(filters);
      } catch (e) {
        throw new ValidationError('Filters must be a URL-encoded JSON.');
      }
    }
    const auctionService = await container.resolve('AuctionService');
    const {auctions, total} = await auctionService.getAuctions(page, perPage, search, filters, sortField, sortDirection);
    res.status(200);
    res.json({
      auctions,
      total,
    });
  },
  'GET /api/v1/auctions/:auction_id': async (req, res) => {
    const auctionService = await container.resolve('AuctionService');
    const auction = await auctionService.getAuction(req.params.auction_id);
    res.status(200);
    res.json({
      auction,
    });
  },
  'GET /api/v1/auctions/n/:name': async (req, res) => {
    const auctionService = await container.resolve('AuctionService');
    const auction = await auctionService.getAuctionByName(req.params.name);
    res.status(200);
    res.json({
      auction,
    });
  },
  'GET /api/v1/auctions/:auction_id/download': async (req, res) => {
    const auctionService = await container.resolve('AuctionService');
    const auction = await auctionService.getAuction(req.params.auction_id);
    await streamAuctionRes(auction, res);
  },
  'GET /api/v1/auctions/n/:name/download': async (req, res) => {
    const auctionService = await container.resolve('AuctionService');
    const auction = await auctionService.getAuctionByName(req.params.name);
    await streamAuctionRes(auction, res)
  },
};

async function streamAuctionRes(auction, res) {
  res.status(200);
  res.append('Content-Disposition', `attachment; filename=auction-${auction.name}-${auction.id}.txt`);
  res.append('Content-Type', 'text/plain');
  const proofs = auction.bids.map(a => new SwapProof({
    name: auction.name,
    lockingTxHash: auction.lockingTxHash,
    lockingOutputIdx: auction.lockingOutputIdx,
    publicKey: auction.publicKey,
    paymentAddr: auction.paymentAddr,
    price: Number(a.price),
    lockTime: Math.floor(a.lockTime / 1000),
    signature: a.signature,
  }));
  await writeProofStream(res, proofs, await container.resolve('SDContext'));
  res.end();
}
