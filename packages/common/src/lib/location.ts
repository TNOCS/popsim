import { Point } from 'geojson';
import { RelationType } from './relation';

export enum LocationType {
  unknown,
  residence,
  primarySchool,
  secondarySchool,
  workplace,
  leisure,
  sport,
  shop
}

export interface ILocation {
  locType: LocationType;
  relType: RelationType;
  geo: Point;
  bId?: number;
  rId?: number;
}
