import { FeatureCollection, GeometryObject } from 'geojson';

export interface IPedestrianMapMsg {
  requestId: number;
  bbox?: number[];
  map: FeatureCollection<GeometryObject>;
}
