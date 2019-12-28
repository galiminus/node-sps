/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createExtension('uuid-ossp');
  pgm.createExtension('postgis');

  pgm.createTable('entities', {
    'id': { type: "uuid", default: pgm.func("uuid_generate_v4()"), primaryKey: true },
  });
  pgm.createIndex('entities', 'id', { method: 'btree' });

  pgm.createTable('servers', {
    'id': { type: "uuid", default: pgm.func("uuid_generate_v4()"), primaryKey: true },
  });
  pgm.createIndex('servers', 'id', { method: 'btree' });

  pgm.createTable('subscriptions', {
    'id': { type: "uuid", default: pgm.func("uuid_generate_v4()") },
    'geometry': { type: "geometry" },
    'pattern': { type: 'string' },
    'entity_id': { type: 'uuid', references: 'entities', onDelete: 'cascade' },
    'server_id': { type: 'uuid', references: 'servers', onDelete: 'cascade' },
  });
  pgm.createIndex('subscriptions', 'pattern', { method: 'btree' });
  pgm.createIndex('subscriptions', 'geometry', { method: 'gist' });
  pgm.createIndex('subscriptions', 'server_id', { method: 'btree' });
  pgm.createIndex('subscriptions', 'entity_id', { method: 'btree' });

  pgm.createTable('actions', {
    'id': { type: "uuid", default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    'queue': { type: 'string' },
    'type': { type: 'string' },
    'payload': { type: 'json' },
    'geometry': { type: "geometry" },
  });
  pgm.createIndex('actions', 'id', { method: 'btree' });
  pgm.createIndex('actions', 'type', { method: 'btree' });

  pgm.createFunction('notify',
    [],
    { language: 'plpgsql', behavior: 'stable', parallel: 'safe', returns: 'trigger' },
    `
      DECLARE
        subscription RECORD;
      BEGIN
        FOR subscription IN
          (
            SELECT server_id, entity_id FROM subscriptions
            WHERE NEW.queue LIKE subscriptions.pattern AND ST_3DIntersects(NEW.geometry, subscriptions.geometry)
          )
        LOOP
          EXECUTE pg_notify(split_part(subscription.server_id::text, '-', 1) || ':' || subscription.entity_id::text, row_to_json(NEW)::text);
        END LOOP;
        RETURN NEW;
      END;
    `
  );

  pgm.createTrigger('actions', 'notify', {
    when: 'AFTER',
    operation: 'INSERT',
    function: 'notify',
    level: 'ROW'
  })
};

exports.down = pgm => {
  pgm.dropTable('subscriptions');
  pgm.dropTable('servers');
  pgm.dropTable('entities');
  pgm.dropTable('actions');
  pgm.dropFunction('notify', []);
  pgm.dropExtension('postgis');
  pgm.dropExtension('uuid-ossp');
};
