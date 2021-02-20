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
CREATE UNIQUE INDEX "auctions_locking_tx_hash_output_idx_uniq" 
ON "auctions" ("locking_tx_hash", "locking_output_idx");
  `);
};

exports.down = function(db) {
  return db.runSql('DROP INDEX "auctions_locking_tx_hash_output_idx_uniq"');
};

exports._meta = {
  "version": 1
};
