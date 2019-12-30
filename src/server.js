const process = require('process');

const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const jwt = require('jsonwebtoken');

const {
  createSubscription,
  destroySubscription,
  listSubscriptions,
  cleanupEntitySubscriptions,
  createAction,
  listenActions
} = require('./operations');

exports.startServer = async () => {
  io.engine.generateId = (request) => (
    jwt.verify(request._query.auth_token, process.env.SPS_MASTER_KEY).id
  )

  io.use((socket, next) => {
    jwt.verify(socket.handshake.query.auth_token, process.env.SPS_MASTER_KEY, (err, decoded) => {
      socket.request.id = decoded.id;
      next();
    })
  });

  io.on('connection', (socket) => {
    socket.on('subscriptions:create', async ({ queue, geometry }, reply) => {
      reply(await createSubscription(socket.request.id, queue, geometry))
    });

    socket.on('subscriptions:destroy', async ({ id }, reply) => {
      reply(await destroySubscription(id))
    });

    socket.on('actions:create', async ({ queue, type, payload, geometry }, reply) => {
      reply(await createAction(socket.request.id, queue, type, payload, geometry));
    });

    listenActions(socket.request.id, function (event) {
      socket.emit('actions:received', event)
    });
  });

  http.listen(process.env.PORT);
};
