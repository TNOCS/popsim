import { OffsetFetchRequest, ConsumerOptions } from 'kafka-node';
import * as baseConfig from '../../config/config.json';
import * as localConfig from '../../config/config.LOCAL.json';

export interface ITimeSchedule {
  starts: string | string[];
  ends: string | string[];
  breakFrom?: string;
  breakTill?: string;
}

export const config: {
  logging: boolean;
  /**
   * Multi-line query string in the Compact query language.
   * Use join to create a regular query, and replace the {{bbox}} with lat_left, lon_bottom, lat_right, lon_top.
   *
   * @type {string[]}
   */
  overpass: {
    query: string[];
    url: string;
  },
  kafka: {
    host: string;
    clientId: string;
    subscription: {
      topics: OffsetFetchRequest[];
      options: ConsumerOptions;
    },
    publication: {
      nav: OffsetFetchRequest;
      map: OffsetFetchRequest;
      options: {
        // Configuration for when to consider a message as acknowledged, default 1
        requireAcks: 1,
        // The amount of time in milliseconds to wait for all acks before considered, default 100ms
        ackTimeoutMs: 100,
        // Partitioner type (default = 0, random = 1, cyclic = 2, keyed = 3, custom = 4), default 0
        partitionerType: 0
      }
    }
  };
} = <any>Object.assign(baseConfig, localConfig);
