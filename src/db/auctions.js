const {container} = require('../container.js');
const {NotFoundError} = require('../service/errors.js');
const {paramOrdinals} = require('./utils.js');

class AuctionsDB {
  constructor(db) {
    this.db = db;
  }

  async getAuctions(page, perPage) {
    const auctionsRes = await this.db.query(`
      SELECT 
        a.id,
        a.name, 
        a.public_key, 
        a.payment_addr, 
        a.locking_tx_hash, 
        a.locking_output_idx, 
        a.created_at,
        a.updated_at
      FROM auctions a ORDER BY a.created_at DESC LIMIT $1 OFFSET $2
    `, [
      perPage,
      (page - 1) * perPage,
    ]);

    if (!auctionsRes.rows.length) {
      return {
        auctions: [],
        total: 0,
      };
    }

    const ids = auctionsRes.rows.map(a => a.id);
    const bidsRes = await this.db.query(`
      SELECT 
        b.auction_id,
        b.price,
        b.signature,
        b.lock_time
      FROM auctions a
      JOIN bids b
      ON a.id = b.auction_id
      WHERE a.id IN (${paramOrdinals(ids)})
      ORDER BY lock_time ASC
    `, ids);

    const bidsIdx = {};
    for (const bid of bidsRes.rows) {
      bidsIdx[bid.auction_id] = bidsIdx[bid.auction_id] || [];
      bidsIdx[bid.auction_id].push(bid);
    }

    const totalRes = await this.db.query(`SELECT count(*) AS count FROM auctions`);
    const total = totalRes.rows[0].count;

    return {
      auctions: auctionsRes.rows.map(a => this.inflateAuctionRow(a, bidsIdx[a.id])),
      total,
    };
  }

  async auctionExists(lockingTxHash, lockingOutputIdx) {
    const res = await this.db.query(
      'SELECT 1 AS exists FROM auctions WHERE locking_tx_hash = $1 AND locking_output_idx = $2',
      [lockingTxHash, lockingOutputIdx],
    );

    return res.rows.length !== 0;
  }

  async saveAuction(auction) {
    const id = await this.db.withTx(async (client) => {
      const now = new Date();
      const auctionParams = [
        auction.name,
        auction.publicKey,
        auction.paymentAddr,
        auction.lockingTxHash,
        auction.lockingOutputIdx,
        now,
        now,
      ];
      const auctionRes = await client.query(`
        INSERT INTO auctions(
            name, 
            public_key, 
            payment_addr, 
            locking_tx_hash, 
            locking_output_idx, 
            created_at,
            updated_at
        ) VALUES(${paramOrdinals(auctionParams)}) RETURNING id
      `, auctionParams);

      for (const bid of auction.data) {
        const bidParams = [
          auctionRes.rows[0].id,
          bid.price,
          bid.signature,
          new Date(bid.lockTime * 1000),
        ];
        await client.query(`
          INSERT INTO bids(auction_id, price, signature, lock_time) VALUES(${paramOrdinals(bidParams)})
        `, bidParams);
      }

      return auctionRes.rows[0].id;
    });

    return this.getAuction(id);
  }

  async getAuction(id) {
    const auctionRes = await this.db.query(`
      SELECT 
        a.id,
        a.name, 
        a.public_key, 
        a.payment_addr, 
        a.locking_tx_hash, 
        a.locking_output_idx, 
        a.created_at,
        a.updated_at,
        b.price,
        b.signature,
        b.lock_time
      FROM auctions a
      JOIN bids b
      ON a.id = b.auction_id
      WHERE a.id = $1
  `, [id]);

    if (!auctionRes.rows.length) {
      throw new NotFoundError(`Auction ${id} not found.`);
    }

    return this.inflateJoinedAuctionRow(auctionRes.rows);
  }

  inflateJoinedAuctionRow(rows) {
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      publicKey: row.public_key,
      paymentAddr: row.payment_addr,
      lockingTxHash: row.locking_tx_hash,
      lockingOutputIdx: row.locking_output_idx,
      createdAt: row.created_at.getTime(),
      updatedAt: row.updated_at.getTime(),
      bids: rows.map(r => ({
        price: Number(r.price),
        signature: r.signature,
        lockTime: r.lock_time.getTime(),
      })),
    };
  }

  inflateAuctionRow(auction, bids) {
    return {
      id: auction.id,
      name: auction.name,
      publicKey: auction.public_key,
      paymentAddr: auction.payment_addr,
      lockingTxHash: auction.locking_tx_hash,
      lockingOutputIdx: auction.locking_output_idx,
      createdAt: auction.created_at.getTime(),
      updatedAt: auction.updated_at.getTime(),
      bids: bids.map(b => ({
        price: Number(b.price),
        signature: b.signature,
        lockTime: b.lock_time.getTime(),
      })),
    };
  }
}

container.register('AuctionsDB', (db) => new AuctionsDB(db), ['Database']);

module.exports = AuctionsDB;