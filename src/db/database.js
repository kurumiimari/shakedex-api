const {Pool, Client} = require('pg');
const {container} = require('../container.js');

class Database {
  constructor(url) {
    this.url = url;
  }

  async open() {
    this.pool = new Pool({
      connectionString: this.url,
    });
    await this.pool.query('SELECT NOW()');
  }

  query(query, params) {
    return this.pool.query(query, params);
  }

  async withTx(cb) {
    let res = undefined;

    await this.connect(async (client) => {
      await client.query('BEGIN');

      try {
        res = await cb(client);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    });

    return res;
  }

  async connect(cb) {
    const client = await this.pool.connect();
    try {
      await cb(client);
    } finally {
      client.release();
    }
  }
}

container.register('Database', async (config) => {
  const db = new Database(config.pgUrl);
  await db.open();
  return db;
}, ['Config']);

module.exports = Database;