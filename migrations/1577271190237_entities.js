/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createExtension('uuid-ossp');
  pgm.createExtension('postgis');

  pgm.createTable('entities', {
    'id': { type: "uuid", default: pgm.func("uuid_generate_v4()") },
  });
  pgm.createTable('subscriptions', {
    'id': { type: "uuid", default: pgm.func("uuid_generate_v4()") },
    'geometry': { type: "geometry" },
    'pattern': { type: 'string' },
    'entity_id': { type: 'uuid' },
    'connection_id': { type: 'string' },
  });
  pgm.createIndex('subscriptions', 'pattern', { method: 'btree' })
  pgm.createIndex('subscriptions', 'geometry', { method: 'gist' })
};

exports.down = pgm => {
  pgm.dropTable('entities');
  pgm.dropTable('subscriptions');
  pgm.dropExtension('postgis');
  pgm.dropExtension('uuid-ossp');
};
