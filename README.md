[![Discord](https://img.shields.io/discord/812809443326558217)](https://discord.gg/sDVEEsvjTJ)

# shakedex-api

A web portal for [shakedex](https://github.com/kurumiimari/shakedex) swap proofs.

Currently in use at [https://www.shakedex.com](https://www.shakedex.com).

## Usage

### Prerequisites

1. Node.js v12+
2. Postgres v12+
3. An HSD full node with `--index-tx` enabled.

### Installation

1. Clone the repo.
2. Run `npm install`.
3. Run `npm i -g db-migrate` to install the database migration tool.
4. Run `DATABASE_URL=<your database url> db-migrate up` to run database migrations.
5. Create a `.env` file with the environment variables described below.
6. Run `source .env && npm run start`.

### Environment Variables

| Name          | Use                                                                                                                       | Default |
|---------------|---------------------------------------------------------------------------------------------------------------------------|---------|
| PORT          | The port Express listens on.                                                                                              | 8080    |
| HSD_HOST      | The HSD host to get chain state from.                                                                                     |         |
| HSD_NETWORK   | The HSD network to get chain state from.                                                                                  | regtest |
| HSD\_API\_KEY   | An API key to authenticate with HSD.                                                                                      |         |
| HSD\_WALLET\_ID | A wallet ID for use with HSD. This is required by the shakedex API, but the server doesn't need any wallet functionality. | primary |
| DATABASE_URL  | A Postgres database URL.                                                                                                  |         |

## Deployment

Elastic Beanstalk configuration files are included if you are using AWS to deploy the app. The configuration files fix an issue with `bcrypto` and `node-gyp`, automatically run migrations upon deploy, and define a `web` process in the `Procfile` to start the app.

## UI/API

The UI is hosted at URLs that do not start with `/api`. API urls are the following:

### GET /api/v1/auctions

**Query Params:** page, per_page

Gets a list of auctions.

### GET /api/v1/auctions/:auction_id

Gets a specific auction.


### GET /api/v1/auctions/:auction_id/download

Download's an auctions swap proofs for fulfillment with the `shakedex` CLI.

### POST /api/v1/auctions

**Body Params:** An auction object. See [this file in shakedex](https://github.com/kurumiimari/shakedex/blob/b3f4b10d62861f9795542341c5c3957385d83112/src/cli/main.js#L235) for what this looks like.

## Security

Please don't report security bugs on GitHub. Instead, send an e-mail to [kurumiimari@protonmail.com](mailto:kurumiimari@protonmail.com).