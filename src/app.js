const logger = require('./logger.js');
const APIRoot = require('./api/root.js');
const {container} = require('./container.js');
const path = require('path');
const cors = require('cors')

const viewsDir = path.join(__dirname, 'views');

const corsOptions = {
  origin: function (origin= '', callback) {
    callback(null, [
      'http://localhost:8080',
      'https://shakedex.com',
      'https://compassionate-yalow-5608e1.netlify.app',
    ]);
  }
};

async function main() {
  const express = require('express');
  const app = express();
  app.use(cors(corsOptions));
  app.use(express.json());
  app.set('view engine', 'pug');
  app.set('views', viewsDir);
  const apiRoot = new APIRoot();
  apiRoot.mount(app);

  const config = await container.resolve('Config');
  const port = config.port;
  app.listen(port, (e) => logger.info('app started', {
    port,
  }));
}

main().catch(error => {
  logger.error('app failed to start', {
    error,
    stack: error.stack
  });
});
