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
      population: OffsetFetchRequest;
      options: {
        // Configuration for when to consider a message as acknowledged, default 1
        requireAcks: 1,
        // The amount of time in milliseconds to wait for all acks before considered, default 100ms
        ackTimeoutMs: 100,
        // Partitioner type (default = 0, random = 1, cyclic = 2, keyed = 3, custom = 4), default 0
        partitionerType: 0
      }
    }
  },
  statistics: {
    male: {
      allAges: number;
      under20: number;
    };
    female: {
      allAges: number;
      under20: number;
    };
    /** Within all households, how many are single parent */
    singleParentPerc: number;
    /** For households with children, what percentage has 1, 2, 3 or more children */
    pairs: {
      oneChild: number;
      twoChildren: number;
      threeOrMoreChildren: number;
      /** Instead of 3 children, use this number to compute how many children a household has */
      threeOrMoreFactor: number;
    };
    /** For single parent households with children, what percentage has 1, 2, 3 or more children */
    singleParent: {
      oneChild: number;
      twoChildren: number;
      threeOrMoreChildren: number;
      threeOrMoreFactor: number;
      aloneWithMother: {
        boy: number;
        girl: number;
      },
      aloneWithFather: {
        boy: number;
        girl: number;
      }
    }
  };
  guesstimates: {
    /**
     *  Sort by area in ascending order
     *
     * @type {{
     *       maxAreaM2: number;
     *       singlesPerc: number;
     *       singleParents: number;
     *       relationships: number;
     *       pairs: number;
     *     }[]}
     */
    householdDistribution: {
      maxAreaM2: number;
      singles: number;
      singleParents: number;
      relationships: number;
      pairs: number;
    }[];
  }
} = <any>Object.assign(baseConfig, localConfig);
