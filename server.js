const process = require('process');

const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const jwt = require('jsonwebtoken');

const { pool } = require('./pool');
const { pubsub } = require('./pubsub');

const {
  createServer,
  destroyServer,
  createSubscription,
  destroySubscription,
  listSubscriptions,
  destroySubscriptionsConnection,
  createAction,
} = require('./operations');

exports.startServer = async () => {
  const server = (await createServer()).result;

  process.on('exit', async () => {
    await destroyServer(server.id);
  });

  io.engine.generateId = (request) => {
    return `${server.id}:${jwt.verify(request._query.auth_token, process.env.SPS_MASTER_KEY).id}`;
  }

  io.use((socket, next) => {
    jwt.verify(socket.handshake.query.auth_token, process.env.SPS_MASTER_KEY, (err, decoded) => {
      socket.request.id = decoded.id;
      next();
    })
  });

  io.on('connection', (socket) => {
      console.log(socket.id)
    socket.on('subscriptions:create', async ({ pattern, geometry }, reply) => {
      reply(await createSubscription(server.id, socket.request.id, socket.id, pattern, geometry))
    });

    socket.on('subscriptions:destroys', async ({ id }, reply) => {
      reply(await destroySubscription(id))
    });

    socket.on('actions:create', async ({ queue, type, payload, geometry }, reply) => {
      reply(await createAction(queue, type, payload, geometry));
      // const results = await pool.query(
      //   "SELECT entity_id, connection FROM subscriptions WHERE $1 LIKE subscriptions.pattern AND ST_3DIntersects($2::geometry, subscriptions.geometry)", [queue, geometry]
      // );
      // results.rows.forEach((row) => {
      //   io.to(row.connection).emit('action', action);
      // });

      // reply({ status: 'ok', recipients: results.rows.map((row) => row.entity_id) });
    });

    socket.on('disconnect', async () => {
      // await destroySubscriptionsConnection(socket.id);
    });
    pubsub.addChannel(socket.id, function (event) {
      console.log("LOL", event);
    });
    pubsub.publish(socket.id, { hello: "world" });
  });

  http.listen(process.env.PORT);
};
