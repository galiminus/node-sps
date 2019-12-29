const process = require('process');
const jwt = require('jsonwebtoken');

const { pool } = require('./pool');

exports.createEntity = async () => {
  const result = await pool.query("INSERT INTO entities DEFAULT VALUES RETURNING id")
  const id = result.rows[0].id;

  return ({
    status: 'ok',
    result: {
      id,
      token: jwt.sign({ id }, process.env.SPS_MASTER_KEY)
    }
  });
}

exports.destroyEntity = async (id) => {
  await pool.query("DELETE FROM entities WHERE id = $1", [id])

  return ({
    status: 'ok',
  });
}

exports.listEntities = async () => {
  const result = await pool.query("SELECT id FROM entities")

  return ({
    status: 'ok',
    result: result.rows.map((entity) => (
      {
        id: entity.id,
        token: jwt.sign({ id: entity.id },process.env.SPS_MASTER_KEY)
      }
    ))
  });
}

exports.createServer = async () => {
  const result = await pool.query("INSERT INTO servers DEFAULT VALUES RETURNING id")

  return ({
    status: 'ok',
    result: result.rows[0]
  });
}

exports.destroyServer = async (id) => {
  await pool.query("DELETE FROM servers WHERE id = $1", [id])

  return ({
    status: 'ok',
  });
}

exports.listServers = async () => {
  const result = await pool.query("SELECT id FROM servers")

  return ({
    status: 'ok',
    result: result.rows
  });
}

exports.createSubscription = async (serverId, entityId, pattern, geometry) => {
  const result = await pool.query(
    'INSERT INTO subscriptions (server_id, entity_id, pattern, geometry) VALUES ($1::uuid, $2::uuid, $3, $4::geometry) RETURNING id', [serverId, entityId, pattern, geometry]
  );

  return({
    status: 'ok',
    result: result.rows[0]
  });
}

exports.destroySubscription = async (id) => {
  await pool.query("DELETE FROM subscriptions WHERE id = $1", [id])

  return ({
    status: 'ok',
  });
}

exports.listSubscriptions = async () => {
  const result = await pool.query("SELECT id, server_id, entity_id, pattern, ST_AsText(geometry) as geometry FROM subscriptions")

  return ({
    status: 'ok',
    result: result.rows
  });
}

exports.cleanupEntitySubscriptions = async (serverId, entityId) => {
  await pool.query("DELETE FROM subscriptions WHERE server_id = $1 AND entity_id = $2", [serverId, entityId])

  return ({
    status: 'ok',
  });
}


exports.createAction = async (queue, type, payload, geometry) => {
  const result = await pool.query(
    'INSERT INTO actions (queue, type, payload, geometry) VALUES ($1, $2, $3::json, $4::geometry) RETURNING id', [queue, type, payload, geometry]
  );

  return({
    status: 'ok',
    result: result.rows[0]
  });
}
