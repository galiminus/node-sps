const process = require('process');
const jwt = require('jsonwebtoken');

const { pool } = require('./pool');
const { pubsub } = require('./pubsub');

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

exports.createSubscription = async (entityId, queue, geometry) => {
  const result = await pool.query(
    'INSERT INTO subscriptions (entity_id, queue, geometry) VALUES ($1::uuid, $2, $3::geometry) RETURNING id', [entityId, queue, geometry]
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
  const result = await pool.query("SELECT id, entity_id, queue, ST_AsText(geometry) as geometry FROM subscriptions")

  return ({
    status: 'ok',
    result: result.rows
  });
}


exports.createAction = async (entityId, queue, type, payload, geometry) => {
  const result = await pool.query(
    'INSERT INTO actions (entity_id, queue, type, payload, geometry) VALUES ($1::uuid, $2, $3, $4::json, $5::geometry) RETURNING id', [entityId, queue, type, payload, geometry]
  );

  return({
    status: 'ok',
    result: result.rows[0]
  });
}

exports.listenActions = async (entityId, callback) => {
  pubsub.addChannel(entityId, callback);
}
