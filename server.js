const process = require('process');

const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const jwt = require('jsonwebtoken');

const { buildConnectionId } = require('./utils');

const {
  createServer,
  destroyServer,
  createSubscription,
  destroySubscription,
  listSubscriptions,
  cleanupEntitySubscriptions,
  createAction,
  listenActions
} = require('./operations');

exports.startServer = async () => {
  const server = (await createServer()).result;

  process.on('exit', async () => {
    await destroyServer(server.id);
  });

  io.engine.generateId = (request) => {
    return buildConnectionId(server.id, jwt.verify(request._query.auth_token, process.env.SPS_MASTER_KEY).id);
  }

  io.use((socket, next) => {
    jwt.verify(socket.handshake.query.auth_token, process.env.SPS_MASTER_KEY, (err, decoded) => {
      socket.request.id = decoded.id;
      next();
    })
  });

  io.on('connection', (socket) => {
    socket.on('subscriptions:create', async ({ queue, geometry }, reply) => {
      reply(await createSubscription(server.id, socket.request.id, queue, geometry))
    });

    socket.on('subscriptions:destroy', async ({ id }, reply) => {
      reply(await destroySubscription(id))
    });

    socket.on('actions:create', async ({ queue, type, payload, geometry }, reply) => {
      reply(await createAction(socket.request.id, queue, type, payload, geometry));
    });

    socket.on('disconnect', async () => {
      await cleanupEntitySubscriptions(server.id, socket.request.id);
    });

    listenActions(server.id, socket.request.id, function (event) {
      socket.emit('actions:received', event)
    });
  });

  http.listen(process.env.PORT);
};
