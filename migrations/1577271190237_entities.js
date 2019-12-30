/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createExtension('uuid-ossp');
  pgm.createExtension('postgis');

  pgm.createTable('entities', {
    'id': { type: "uuid", default: pgm.func("uuid_generate_v4()"), primaryKey: true },
  });
  pgm.createIndex('entities', 'id', { method: 'btree' });

  pgm.createTable('subscriptions', {
    'id': { type: "uuid", default: pgm.func("uuid_generate_v4()") },
    'geometry': { type: "geometry" },
    'queue': { type: 'string' },
    'entity_id': { type: 'uuid', references: 'entities', onDelete: 'cascade' },
  });
  pgm.createIndex('subscriptions', 'queue', { method: 'btree' });
  pgm.createIndex('subscriptions', 'geometry', { method: 'gist' });
  pgm.createIndex('subscriptions', 'entity_id', { method: 'btree' });

  pgm.createTable('actions', {
    'id': { type: "uuid", default: pgm.func("uuid_generate_v4()"), primaryKey: true },
    'entity_id': { type: 'uuid', references: 'entities', onDelete: 'cascade' },
    'queue': { type: 'string' },
    'type': { type: 'string' },
    'payload': { type: 'json' },
    'geometry': { type: "geometry" },
  });
  pgm.createIndex('actions', 'id', { method: 'btree' });
  pgm.createIndex('actions', 'type', { method: 'btree' });
  pgm.createIndex('actions', 'entity_id', { method: 'btree' });

  pgm.createFunction('notify',
    [],
    { language: 'plpgsql', behavior: 'stable', parallel: 'safe', returns: 'trigger' },
    `
      DECLARE
        subscription RECORD;
      BEGIN
        FOR subscription IN
          (
            SELECT entity_id FROM subscriptions
            WHERE NEW.queue = subscriptions.queue AND ST_3DIntersects(NEW.geometry, subscriptions.geometry)
          )
        LOOP
          EXECUTE pg_notify(
            subscription.entity_id::text,
            json_build_object('id', NEW.id, 'entity_id', NEW.entity_id, 'type', NEW.type, 'payload', NEW.payload)::text
          );
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
  pgm.dropTable('actions');
  pgm.dropTable('entities');
  pgm.dropFunction('notify', []);
  pgm.dropExtension('postgis');
  pgm.dropExtension('uuid-ossp');
};
