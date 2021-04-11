const logger = require('../logger.js');
const {container} = require('../container.js');
const {NotFoundError} = require('./errors.js');

const CONFIRMATION_DEPTH = 1;

class Indexer {
  constructor(chainDb, auctionsDb, sdContext) {
    this.chainDb = chainDb;
    this.auctionsDb = auctionsDb;
    this.sdContext = sdContext;
    this.logger = logger.child({service: 'Indexer'});
  }

  async indexChain() {
    const {nodeClient, networkName} = this.sdContext;
    const info = await nodeClient.getInfo();
    const chainHeight = info.chain.height;
    let indexedHeight = await this.chainDb.getIndexedHeight();
    if (networkName === 'main' && indexedHeight < 56000) {
      indexedHeight = 56000;
    }

    for (let i = indexedHeight + 1; i < chainHeight - CONFIRMATION_DEPTH; i++) {
      await this.indexBlock(i);
    }
  }

  async indexBlock(height) {
    this.logger.info('indexing block', {
      height,
    });
    const {nodeClient} = this.sdContext;
    const block = await nodeClient.execute('getblockbyheight', [height, true, true]);

    const toStore = [];
    for (const tx of block.tx) {
      let auctionId = null;

      for (let i = 0; i < tx.vin.length; i++) {
        const vin = tx.vin[i];

        // skip coinbase
        if (vin.txid === '0000000000000000000000000000000000000000000000000000000000000000') {
          continue
        }

        try {
          auctionId = await this.auctionsDb.getAuctionIdByOutpoint(vin.txid, vin.vout);
        } catch (e) {
          if (e instanceof NotFoundError) {
            continue;
          }
          throw e;
        }

        break;
      }

      if (!auctionId) {
        continue;
      }

      let status = 'CANCELLED';
      for (const vout of tx.vout) {

        try {
          await this.auctionsDb.getBidByAuctionIdPrice(auctionId, vout.value * 1e6);
        } catch (e) {
          if (e instanceof NotFoundError) {
            continue;
          }
          throw e;
        }

        status = 'COMPLETED';
        break;
      }

      toStore.push({
        id: auctionId,
        txHash: tx.txid,
        status,
      });

      this.logger.info('discovered spent auction', {
        height,
        auctionId,
        txHash: tx.txid,
        status,
      });
    }

    await this.auctionsDb.indexBlock(height, toStore);
    this.logger.info('indexed block', {
      height,
      spentAuctions: toStore.length,
    });
  }
}

container.register(
  'IndexerService',
  (chainDb, auctionsDb, sdContext) => new Indexer(chainDb, auctionsDb, sdContext),
  ['ChainDB', 'AuctionsDB', 'SDContext'],
);