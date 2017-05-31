import { IHousehold } from './household';

export enum Gender {
  male, female, other
}

export enum PersonRole {
  mother, father, child, single,
  employee
}

export interface IPerson {
  age: number;
  gender: Gender;
  roles: PersonRole[];
  /** A concatenation of building id - residence id */
  householdId?: string;
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
