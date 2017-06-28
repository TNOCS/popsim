import { IActivity } from './activity';
import { ILocation } from './location';

export enum Gender {
  male, female, other
}

export enum PersonRole {
  unknown,
  mother,
  father,
  child,
  single,
  /** Employee in a shop, store, office, school, hospital etc.  */
  employee,
  /** Person visiting a shop, office, hospital, sport facility */
  visitor,
  /** Someone attending a sport facility */
  sporter,
  /** Someone attending a school or other form of education */
  student
}

export interface IRoleAtLocation {
  role: PersonRole;
  /** Index of the location you do it, e.g. the index of the workplace location */
  location: number;
  /** Percentage, so if fte === 1, you spend all your time being that role (e.g. father, mother, child etc.) */
  fte: number;
}

export interface IPerson {
  age: number;
  gender: Gender;
  /** When true, person is from selected area. */
  isLocal: boolean;
  roles: IRoleAtLocation[];
  /** A list of locations with specific relevance to the person */
  locations: ILocation[];
  /** A list of planned activies for the day */
  agenda?: IActivity[];
  /**
   * Stack of behaviours, top one is currently active. E.g. standing still, walking, following someone else, etc.
   * Models are pushed from two sources: an activity in the agenda, or an event that needs an agent.
   *
   * Agenda -> has activity -> has models. When an activity becomes active, its models are pushed onto the stack.
   */
  behaviourModels?: any[];
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
