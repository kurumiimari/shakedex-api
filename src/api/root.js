const logger = require('../logger.js');
const {NotFoundError, ValidationError} = require('../service/errors.js');

class APIRoot {
  constructor() {
    this.routes = {
      ...require('./auctions.js'),
    };
    this.logger = logger.child({
      service: 'API',
    });
  }

  mount(app) {
    for (const route of Object.keys(this.routes)) {
      const [method, path] = route.split(' ');
      this.logger.debug('mounted route', {
        method,
        path,
      });
      const handler = this.routes[route];
      app[method.toLowerCase()](path, (req, res, next) => {
        const logParams = {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
        };
        this.logger.info('received request', logParams);

        handler(req, res, next).catch(e => {
          if (e.name === 'ValidationError') {
            res.status(400);
            res.json({
              error: {
                message: e.message,
                type: 'ValidationError',
                code: 400,
              },
            });
            return;
          }

          if (e.name === 'NotFoundError') {
            res.status(404);
            res.json({
              error: {
                message: e.message,
                type: 'NotFoundError',
                code: 404,
              },
            });
            return;
          }

          this.logger.error('error during request', {
            ...logParams,
            errorName: e.name,
            stack: e.stack,
          });

          res.status(500);
          res.json({
            message: 'An internal error occurred. Please try again later.',
          });
        });
      });
    }
  }
}

module.exports = APIRoot;