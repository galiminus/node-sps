const program = require('commander');
const process = require('process');

const { startServer } = require('./server');
const { pool } = require('./pool');
const {
  createEntity,
  destroyEntity,
  listEntities,
  createServer,
  destroyServer,
  listServers,
  createSubscription,
  destroySubscription,
  listSubscriptions,
  createAction
} = require('./operations');

program
  .command('serve')
  .description('Starts socket.io server')
  .action(() => {
    startServer();
  });

program
  .command('entities:create')
  .description('Create a new entity')
  .action(async () => {
    console.log(JSON.stringify(await createEntity()));
    pool.end();
  });

program
  .command('entities:destroy <id>')
   .description('Remove an existing entity')
   .action(async (id) => {
      console.log(JSON.stringify(await destroyEntity(id)));
      pool.end();
   });

program
  .command('entities:list')
   .description('List all entities')
   .action(async (id) => {
      console.log(JSON.stringify(await listEntities()));
      pool.end();
   });

program
  .command('servers:create')
  .description('Create a new server')
  .action(async () => {
    console.log(JSON.stringify(await createServer()));
    pool.end();
  });

program
  .command('servers:destroy <id>')
   .description('Remove an existing server')
   .action(async (id) => {
      console.log(JSON.stringify(await destroyServer(id)));
      pool.end();
   });

program
  .command('servers:list')
   .description('List all servers')
   .action(async (id) => {
      console.log(JSON.stringify(await listServers()));
      pool.end();
   });

program
  .command('subscriptions:create <serverId> <entityId> <pattern> <geometry>')
   .description('Create a new subscription')
   .action(async (server, entityId, pattern, geometry) => {
      console.log(JSON.stringify(await createSubscription(server, entityId, pattern, geometry)));
      pool.end();
   });

program
  .command('subscriptions:destroy <id>')
   .description('Remove an existing subscription')
   .action(async (id) => {
      console.log(JSON.stringify(await destroySubscription(id)));
      pool.end();
   });

program
  .command('subscriptions:list')
   .description('List all subscriptions')
   .action(async (id) => {
      console.log(JSON.stringify(await listSubscriptions()));
      pool.end();
   });

program
  .command('actions:create <queue> <type> <payload> <geometry>')
  .description('Push a new action')
  .action(async (queue, type, payload, geometry) => {
    console.log(JSON.stringify(await createAction(queue, type, payload, geometry)));
  });

program.parse(process.argv);
