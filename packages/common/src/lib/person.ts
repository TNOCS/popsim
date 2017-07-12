import { AreaTrigger } from './area-trigger';
import { ILocation } from './location';

export enum Gender {
  male, female, other
}

export enum PersonRole {
  unknown = 0,
  mother = 1,
  father = 2,
  child = 3,
  single = 4,
  /** Employee in a shop, store, office, school, hospital etc.  */
  employee = 5,
  /** Person visiting a shop, office, hospital, sport facility */
  visitor = 6,
  /** Someone attending a sport facility */
  sporter = 7,
  /** Someone attending a school or other form of education */
  student = 8
}

export interface IRoleAtLocation {
  role: PersonRole;
  /** Index of the location you do it, e.g. the index of the workplace location */
  location: number;
  /** Percentage, so if fte === 1, you spend all your time being that role (e.g. father, mother, child etc.) */
  fte: number;
}

export interface IPerson {
  /**
   * Unique identifier.
   *
   * @type {string}
   * @memberof IPerson
   */
  id?: string;
  age: number;
  gender: Gender;
  /** When true, person is from selected area. */
  isLocal: boolean;
  roles: IRoleAtLocation[];
  /** A list of locations with specific relevance to the person: the first location is his home */
  locations: ILocation[];
  /** A list of (the GUIDs of) planned activies for the day */
  agenda?: string[];
  /**
   * Stack of behaviours, top one is currently active. E.g. standing still, walking, following someone else, etc.
   * Models are pushed from two sources: an activity in the agenda, or an event that needs an agent.
   *
   * Agenda -> has activity -> has models. When an activity becomes active, its models are pushed onto the stack.
   */
  behaviourModels?: any[];
  /**
   * Triggers a change in behaviour when entering an area.
   *
   * @type {GeometryObject[]}
   * @memberof IPerson
   */
  areaTriggers?: AreaTrigger[];
}

export interface IChildDistribution {
  count: number;
  oneChild: {
    male: number;
    female: number;
  };
  twoChildren: {
    male: number;
    female: number;
  };
  threeOrMoreChildren: {
    male: number;
    female: number;
  };
}

export interface IPopulation {
  children: IPerson[];
  singles: IPerson[];
  relationships: IPerson[];
  pairs: IPerson[];
  singleParents: IPerson[];
  singeParentChildDistribution: IChildDistribution;
  pairsChildDistribution: IChildDistribution;
}
