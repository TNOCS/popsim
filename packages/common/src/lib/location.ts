import { Point } from 'geojson';
import { RelationType } from './relation';

export enum LocationType {
  unknown = 0,
  residence = 1,
  primarySchool = 2,
  secondarySchool = 3,
  workplace = 4,
  leisure = 5,
  sport = 6,
  shop = 7
}

export interface ILocation {
  locType: LocationType;
  relType: RelationType;
  geo: Point;
  bId?: number;
  rId?: number;
}
