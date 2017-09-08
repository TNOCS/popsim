import { FeatureCollection, GeometryObject } from 'GeoJSON';

export interface IPedestrianMapMsg {
  requestId: number;
  bbox?: number[];
  map: FeatureCollection<GeometryObject>;
}
