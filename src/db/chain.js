const {container} = require('../container.js');

class ChainDB {
  constructor(db) {
    this.db = db;
  }

  async getIndexedHeight() {
    const res = await this.db.query('SELECT indexed_height FROM chain_index_state');
    return res.rows[0].indexed_height;
  }
}

container.register('ChainDB', (db) => new ChainDB(db), ['Database']);