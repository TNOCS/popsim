import * as pg from 'pg';
import { config } from './configuration';

const log = config.logging ? console.log : () => { return; };

// This initializes a connection pool:
// It will keep idle connections open for idleTimeoutMillis msecs
// and set a limit of maximum max idle clients
const pool = new pg.Pool(config);

pool.on('error', (err: Error, client: any) => {
  // if an error is encountered by a client while it sits idle in the pool
  // the pool itself will emit an error event with both the error and
  // the client which emitted the original error
  // this is a rare occurrence but can happen if there is a network partition
  // between your application and the database, the database restarts, etc.
  // and so you might want to handle it and at least log it out
  console.error('idle client error', err.message, err.stack);
});

// export the query method for passing queries to the pool
export const query = (queryText: string, values: Array<any>) => {
  log('query:', queryText, values);
  return pool.query(queryText, values);
};

// the pool also supports checking out a client for
// multiple operations, such as a transaction
export const connect = () => {
  return pool.connect();
};
