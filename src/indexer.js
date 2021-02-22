const logger = require('./logger.js');
const {container} = require('./container.js');

async function main() {
  const indexer = await container.resolve('IndexerService');
  logger.info('indexing chain');
  await indexer.indexChain();
  logger.info('done');
  process.exit(0);
}

main().catch(error => {
  logger.error('indexing failed', {
    error,
    stack: error.stack,
  });
  process.exit(1);
});