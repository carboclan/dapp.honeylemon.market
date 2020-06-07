const { Client } = require('pg');

module.exports = {
  resetSubgraph: async () => {
    const client = new Client({
      user: 'root',
      host: 'localhost',
      database: 'graph-node',
      password: 'password',
      port: 5432
    });
    await client.connect();

    const query = `
    DO
    $func$
    BEGIN
       -- RAISE NOTICE '%',
       EXECUTE
       (SELECT 'TRUNCATE TABLE ' || string_agg(oid::regclass::text, ', ') || ' CASCADE'
        FROM   pg_class
        WHERE  relkind = 'r'  -- only tables
        AND    relnamespace = 'sgd1'::regnamespace
       );
    END
    $func$;
    `;

    try {
      await client.query(query);
    } finally {
      client.end();
    }
  }
};
