import { OffsetFetchRequest, ConsumerOptions } from 'kafka-node';
import * as baseConfig from '../../config/config.json';
import * as localConfig from '../../config/config.LOCAL.json';

export const config: {
  logging: boolean;
  kafka: {
    host: string;
    clientId: string;
    subscription: {
      topics: OffsetFetchRequest[];
      options: ConsumerOptions;
    },
    publication: {
      area: OffsetFetchRequest;
      options: {
        // Configuration for when to consider a message as acknowledged, default 1
        requireAcks: 1,
        // The amount of time in milliseconds to wait for all acks before considered, default 100ms
        ackTimeoutMs: 100,
        // Partitioner type (default = 0, random = 1, cyclic = 2, keyed = 3, custom = 4), default 0
        partitionerType: 0
      }
    }
  }
  user: string; // env var: PGUSER
  database: string; // env var: PGDATABASE
  password: string; // env var: PGPASSWORD
  host: string; // Server hosting the postgres database
  port: number; // env var: PGPORT
  max: number; // max number of clients in the pool
  idleTimeoutMillis: number; // how long a client is allowed to remain idle before being closed
} = <any>Object.assign(baseConfig, localConfig);
