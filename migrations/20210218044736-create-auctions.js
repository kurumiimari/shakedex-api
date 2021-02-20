'use strict';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.runSql(`
CREATE TABLE auctions (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    public_key VARCHAR NOT NULL,
    payment_addr VARCHAR NOT NULL,
    locking_tx_hash VARCHAR NOT NULL,
    locking_output_idx INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE bids (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER NOT NULL REFERENCES auctions(id),
    price DECIMAL(16) NOT NULL,
    signature VARCHAR NOT NULL,
    lock_time TIMESTAMP WITH TIME ZONE NOT NULL
)
  `);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};
