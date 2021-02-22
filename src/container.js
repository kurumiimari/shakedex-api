const logger = require('./logger.js');

class Container {
  constructor() {
    this._registry = {};
    this._services = {};
    this.logger = logger.child({service: 'Container'});
  }

  register(name, factory, deps = []) {
    if (this._registry[name]) {
      this.logger.warn('duplicate service registration', {
        name,
      });
      return;
    }

    this.logger.debug('registering service', {
      name,
    });

    this._registry[name] = {
      factory,
      deps,
    };
  }

  async resolve(name) {
    this.logger.debug('resolving service', {
      name,
    });

    if (this._services[name]) {
      return this._services[name];
    }

    const registration = this._registry[name];
    if (!registration) {
      throw new Error(`Unknown service ${name}.`);
    }

    const deps = [];
    for (const dep of registration.deps) {
      const instance = await this.resolve(dep);
      deps.push(instance);
    }

    return registration.factory(...deps);
  }
}

exports.Container = Container;
exports.container = new Container();

require('./config.js');
require('./sdContext.js');
require('./db/database.js');
require('./db/auctions.js');
require('./db/chain.js');
require('./service/auctions.js');
require('./service/indexer.js');