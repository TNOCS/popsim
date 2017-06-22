import { Point } from 'geojson';
import { IPerson } from './person';

export enum WorkplaceType {
  unknown,
  office,
  shop,
  sport,
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
  geo: Point;
}
