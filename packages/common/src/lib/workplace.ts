import { IPerson } from './person';

export enum WorkplaceType {
  unknown,
  office,
  shop,
  catering, // horeca
  school,
  care,
  other
}

export interface IWorkplace {
  /** Building ID */
  bId: number;
  area: number;
  workplaceType: WorkplaceType;
  persons: IPerson[];
}
