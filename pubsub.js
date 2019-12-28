const process = require('process');
const PGPubsub = require('pg-pubsub');

exports.pubsub = new PGPubsub(process.env.DATABASE_URL);

