import { IPerson } from './person';

export enum HouseholdType {
  unknown,
  /**
   * Pair: has children
   */
  pair,
  /**
   * Relationship: no children
   */
  relationship,
  singleParent,
  single
}

export interface IHousehold {
  /** Building ID */
  bId: number;
  /** Residence ID inside building */
  rId: number;
  area: number;
  householdType: HouseholdType;
  persons: IPerson[];
}
