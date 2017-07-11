import { ILocation } from './location';

export enum ActivityType {
  unknown = 0,
  walking = 1,
  cycling = 2,
  driving = 3,
  resting = 4,
  working = 5,
  shopping = 6,
  sporting = 7,
  travelling = 8
}

export interface IActivity {
  /**
   * Optional unique identifier of an activity.
   *
   * @type {string}
   * @memberof IActivity
   */
  id?: string;
  name: string;
  activity: ActivityType;
  /**
   * Place where the activity ends.
   *
   * @type {ILocation}
   * @memberof IActivity
   */
  location: ILocation;
  start: Date;
  end: Date;
  /**
   * IDs of the persons participating in this activity, e.g. your family or friends.
   *
   * @type {number[]}
   * @memberof IActivity
   */
  group?: string[];
}
