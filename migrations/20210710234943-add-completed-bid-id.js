'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.runSql(`
ALTER TABLE auctions ADD COLUMN completed_bid_id INTEGER REFERENCES bids(id);
  `);
};

exports.down = function(db) {
  return db.runSql(`
ALTER TABLE auctions DROP COLUMN completed_bid_id;
  `);
};

exports._meta = {
  "version": 1
};
