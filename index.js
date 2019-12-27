const program = require('commander');
const process = require('process');
const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');

const { http } = require('./server');
const { pool } = require('./pool');

program
  .command('serve')
  .description('Starts socket.io server')
  .action(() => {
    http.listen(process.env.PORT);
  });

program
  .command('entities:create')
  .description('Create a new entity')
  .action(async () => {
    const results = await pool.query("INSERT INTO entities DEFAULT VALUES RETURNING id")
    pool.end();

    const id = results.rows[0].id;

    console.log(JSON.stringify({
      status: 'ok',
      entity: {
        id,
        token: jwt.sign({ id }, process.env.SPS_MASTER_KEY)
      }
    }));
  });

program
  .command('entities:destroy <id>')
   .description('Remove an existing entity')
   .action(async (id) => {
      await pool.query("DELETE FROM entities WHERE id = $1", [id])
      pool.end();

      console.log(JSON.stringify({ status: 'ok' }))
   });

program
  .command('entities:list')
   .description('List all entities')
   .action(async (id) => {
      const results = await pool.query("SELECT id FROM entities")
      pool.end();

      console.log(JSON.stringify({
        status: 'ok',
        entities: results.rows.map((entity) => (
          { id: entity.id, token: jwt.sign({ id: entity.id }, process.env.SPS_MASTER_KEY) }
        ))
      }))
   });

program.parse(process.argv);
