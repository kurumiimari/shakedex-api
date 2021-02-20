const {container} = require('./container.js');

class Config {
  constructor(
    port = 8080,
    hsdHost,
    hsdNetwork,
    hsdApiKey,
    hsdWalletId = 'primary',
    pgUrl,
  ) {
    this.port = port;
    this.hsdHost = hsdHost;
    this.hsdNetwork = hsdNetwork;
    this.hsdApiKey = hsdApiKey;
    this.hsdWalletId = hsdWalletId;
    this.pgUrl = pgUrl;
  }

  static fromEnv() {
    return new Config(
      process.env.PORT || 8080,
      process.env.HSD_HOST,
      process.env.HSD_NETWORK || 'regtest',
      process.env.HSD_API_KEY || '',
      process.env.HSD_WALLET_ID || 'primary',
      process.env.DATABASE_URL,
    );
  }
}

container.register('Config', () => {
  return Promise.resolve(Config.fromEnv());
});

module.exports = Config;