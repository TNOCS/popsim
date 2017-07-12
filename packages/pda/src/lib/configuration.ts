import { IRuleSet } from '@popsim/rules';
import { ITimeSchedule } from './configuration';
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
  kafka: {
    host: string;
    clientId: string;
    subscription: {
      topics: OffsetFetchRequest[];
      options: ConsumerOptions;
    },
    publication: {
      activities: OffsetFetchRequest;
      persons: OffsetFetchRequest;
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
  primarySchools: {
    schedule: {
      Mon: ITimeSchedule;
      Tue: ITimeSchedule;
      Wed: ITimeSchedule;
      Thu: ITimeSchedule;
      Fri: ITimeSchedule;
      [key: string]: ITimeSchedule;
    }
  };
  secondarySchools: {
    schedule: {
      Mon: ITimeSchedule;
      Tue: ITimeSchedule;
      Wed: ITimeSchedule;
      Thu: ITimeSchedule;
      Fri: ITimeSchedule;
      [key: string]: ITimeSchedule;
    }
  };
  /**
   * Specifies the rule set for the travelling speed (and mode)
   *
   * @type {IRuleSet}
   */
  transportation: IRuleSet,
  work: {
    /**
     * Specifies the rule set for the time schedule
     *
     * @type {IRuleSet}
     */
    schedule: IRuleSet,
    walkingSpeedKmh: number;
    cyclingSpeedKmh: number;
    drivingSpeedKmh: number;
    maxWalkingDistance: number;
    maxCyclingDistance: number;
  };
  accompanyChild: {
    /**
     * Walking speed with which you can bring a child to school, in km/h
     *
     * @type {number}
     */
    walkingSpeedKmh: number;
    /**
     * Cycling speed with which you can bring a child to school, in km/h
     *
     * @type {number}
     */
    cyclingSpeedKmh: number;
    /**
     * Driving speed with which you can bring a child to school, in km/h
     *
     * @type {number}
     */
    drivingSpeedKmh: number;
    maxWalkingDistance: number;
    maxCyclingDistance: number;
    toSchool: IRuleSet
  };
} = <any>Object.assign(baseConfig, localConfig);
