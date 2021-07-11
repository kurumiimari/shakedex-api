const {container} = require('../container.js');

class StatsDB {
  constructor(db) {
    this.db = db;
  }

  async getStats() {
    const totalAuctionsRes = await this.db.query('SELECT COUNT(*) AS count FROM auctions');
    const totalAuctions = totalAuctionsRes.rows[0].count;
    const totalCancellationsRes = await this.db.query(
      'SELECT COUNT(*) AS count FROM auctions WHERE spending_status = $1',
      ['CANCELLED'],
    );
    const totalCancellations = totalCancellationsRes.rows[0].count;
    const totalCompletesRes = await this.db.query(
      'SELECT COUNT(*) AS count FROM auctions WHERE spending_status = $1',
      ['COMPLETED'],
    );
    const totalCompletes = totalCompletesRes.rows[0].count;

    const auctionCountByDayRes = await this.db.query(
      `SELECT count(*) AS count, date_trunc('day', created_at) AS day
       FROM auctions
       WHERE created_at >= NOW() - '30 days'::INTERVAL
       GROUP BY date_trunc('day', created_at)
       ORDER BY day`,
    );

    const monthlyVolumeRes = await this.db.query(
      `SELECT sum(bids.price) AS value, date_trunc('month', created_at) AS month
       FROM auctions
                JOIN bids ON auctions.id = bids.auction_id
       WHERE created_at >= NOW() - '1 year'::INTERVAL
       GROUP BY date_trunc('month', created_at)
       ORDER BY month`,
    );

    return {
      totalAuctions,
      totalCancellations,
      totalCompletes,
      auctionCountByDay: auctionCountByDayRes.rows.map(r => ({
        date: r.day.getTime(),
        count: Number(r.count),
      })),
      monthlyVolume: monthlyVolumeRes.rows.map(r => ({
        month: r.month.getMonth(),
        count: Number(r.value),
      })),
    };
  }
}

container.register('StatsDB', (db) => new StatsDB(db), ['Database']);

module.exports = StatsDB;