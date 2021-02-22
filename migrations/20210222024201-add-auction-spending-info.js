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
CREATE TABLE chain_index_state (
    indexed_height INTEGER NOT NULL DEFAULT 0,
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO chain_index_state(indexed_height) VALUES (0);

CREATE INDEX auctions_locking_tx_hash_idx ON auctions(locking_tx_hash);
CREATE INDEX auctions_locking_output_idx_idx ON auctions(locking_output_idx);

ALTER TABLE auctions ADD COLUMN spending_tx_hash VARCHAR;
ALTER TABLE auctions ADD COLUMN spending_status VARCHAR;
  `);
};

exports.down = function(db) {
  return db.runSql(`
ALTER TABLE auctions DROP COLUMN spending_tx_hash;

DROP TABLE chain_index_state;
DROP INDEX auctions_locking_tx_hash_idx;
DROP INDEX auctions_locking_output_idx_idx;
  `);
};

exports._meta = {
  "version": 1
};
