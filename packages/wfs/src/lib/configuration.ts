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
      workforce: OffsetFetchRequest;
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
  };
  statistics: {
    /**
     * The average travelling distance is 30km for men, and 16km for women according to
     * [CBS](https://www.cbs.nl/nl-nl/nieuws/2016/25/hoogopgeleide-man-maakt-de-meeste-woon-werkkilometers).
     * Mostly by car, but distances <5km by bike (about 1000km per year per person).
     *
     * @see [transport and mobility report 2016](https://www.cbs.nl/nl-nl/publicatie/2016/25/transport-en-mobiliteit-2016).
     * @type {{
     *       men: number,
     *       women: number
     *     }}
     */
    travellingDistance: {
      avgKm: {
        men: number,
        women: number
      }
    };
    /** How many kms are men/women willing to travel to VISIT a shop, hospital, school, etc. NOT VALIDATED */
    visitingDistance: {
      avgKm: {
        men: number,
        women: number
      }
    };
    /** Percentage of male vs female workers. NOT VALIDATED */
    maleFemaleWorkerPerc: number;
    /** Percentage of male vs female visitors. NOT VALIDATED */
    maleFemaleVisitorPerc: number;
    offices: {
      /**
       * How many of the offices are empty
       *
       * @see [Compendium voor de Leefomgeving](http://www.clo.nl/indicatoren/nl2152-leegstand-kantoren), about 17% of all offices were empty in 2016.
       * @type {number} Range [0...1]
       */
      emptyProbability: number;
      /**
       * How much of an office space is available for work
       * @see Flexas : Based on [Flexas](https://www.flexas.nl/blog/hoeveel-m2-kantoorruimte-heb-je-nodig), about half (55%) of an office space is needed as workplace, whereas the other 45% is used for the construction, elevator, corridors, and meeting rooms. An actual workplace (desk with PC etc.) requires between 10 and 15m2.
       * @type {number} Range [0...1]
       */
      workAreaProbability: number;
      workspaceM2: number;
    },
    /**
     * What is the probability that we can reuse an already created long distance person,
     * i.e. we may have already created a long distance worker, and we use him to do some shopping too.
     */
    reuseProbability: number;
    shops: {
      /**
       * Based on the info from [Detailhandel.info](http://detailhandel.info), we can calculate a very rough
       * estimate of the number of FTE per m2.
       *
       * Since we do not know what kind of shop we are dealing with, e.g. supermarkets or garden shop, it is
       * difficult to get a good estimation. Both are, on average, big, but a supermarket has many more FTE's employed.
       */
      ftePerM2: number;
      /**
       * How many customers do we have per m2 or per FTE
       * NOT VALIDATED
       */
      customersPerM2: number;
    };
    sports: {
      /**
       * Since we do not know what kind of sport facility we are dealing with, pick a low number to represent catering,
       * trainers, reception. Based on the number of sporters, we expect that for every X sporters, you need 1 staff.
       * NOT VALIDATED
       */
      ftePerM2: number;
      /**
       * How many sporters do we have per m2 or per FTE
       * NOT VALIDATED
       */
      sportersPerM2: number;
      /**
       * Ratio male vs female sporters [0-1]
       * NOT VALIDATED
       */
      maleFemaleRatio: number;
    };
    schools: {
      /**
       * How many students can a primary school have. Used to create primary and secondary schools.
       * Universities etc are ignored for now.
       * NOT VALIDATED
       */
      maxPrimarySchoolSize: number;
      /**
       * Assuming an average classroom size and a number of studentsPerM2, how many teachers, principals etc. do we need.
       * NOT VALIDATED
       */
      ftePerM2: number;
      /**
       * How many students do we have per m2. In NL, the min requirement is that each student in primary education needs
       * to have a space of at least 3.5m2 (based on the whole school).
       * NOT VALIDATED
       */
      studentsPerM2: number;
    }
  };
  /** Defines the outer bounding box as a delta w.r.t. the inner bounding box */
  outerBboxDelta: number[]
} = <any>Object.assign(baseConfig, localConfig);
