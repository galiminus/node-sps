const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const jwt = require('jsonwebtoken');

const { pool } = require('./pool');

io.use((socket, next) => {
  jwt.verify(socket.handshake.query.auth_token, process.env.SPS_MASTER_KEY, (err, decoded) => {
    socket.request.id = decoded.id;
    next();
  })
});

io.on('connection', (socket) => {
  socket.on('subscribe', async ({ pattern, geometry }, reply) => {
    const results = await pool.query(
      'INSERT INTO subscriptions (entity_id, connection_id, pattern, geometry) VALUES ($1::uuid, $2, $3, $4) RETURNING id', [socket.request.id, socket.id, pattern, geometry]
    );

    reply({ status: 'ok', id: results.rows[0].id })
  });

  socket.on('unsubscribe', async ({ id }, reply) => {
    await pool.query(
      'DELETE FROM subscriptions WHERE id = $2', [socket.id, id]
    );

    reply({ status: 'ok' });
  });

  socket.on('publish', async ({ queue, geometry, action }, reply) => {
    const results = await pool.query(
      "SELECT entity_id, connection_id FROM subscriptions WHERE $1 LIKE subscriptions.pattern AND ST_3DIntersects($2::geometry, subscriptions.geometry)", [queue, geometry]
    );
    results.rows.forEach((row) => {
      io.to(row.connection_id).emit('action', action);
    });

    reply({ status: 'ok', recipients: results.rows.map((row) => row.entity_id) });
  });

  socket.on('disconnect', async () => {
    await pool.query(
      'DELETE FROM subscriptions WHERE connection_id = $1', [socket.id]
    );
  });
});

exports.http = http;
