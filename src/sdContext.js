const {container} = require('./container.js');
const {Context} = require('shakedex/src/context.js');

container.register('SDContext', (config) => new Context(
  config.hsdNetwork,
  config.hsdWalletId,
  config.hsdApiKey,
  () => Promise.reject('no passphrase configured'),
  config.hsdHost,
), ['Config']);