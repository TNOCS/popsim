import { FeatureCollection, Feature, Polygon, Point, GeometryObject } from 'geojson';

export interface IBuildingFeatureCollection extends FeatureCollection<GeometryObject> {
  type: 'FeatureCollection';
  features: Array<IBuildingFeature>;
}

export interface IBuildingFeature extends Feature<Polygon> {
  properties: IBuildingProps;
}

export interface IBuildingProps {
  id: number;
  straat: string;
  min_nummer: number;
  max_nummer: number;
  totaal_opp: number;
  bouwjaar: number;
  /** Geo-location of the first residence */
  geopunt: Point;
  /** number of houses/appts */
  aant_won: number;
  /** Total area for house/appt in building */
  opp_won: number;
  /** area for each house/appt */
  won_opp: number[];
  aant_win: number;
  opp_win: number;
  aant_kan: number;
  opp_kan: number;
  aant_sport: number;
  opp_sport: number;
  aant_ind: number;
  opp_ind: number;
  aant_logies: number;
  opp_logies: number;
  aant_zorg: number;
  opp_zorg: number;
  aant_cel: number;
  opp_cel: number;
  aant_les: number;
  opp_les: number;
  aant_bij: number;
  opp_bij: number;
  aant_overig: number;
  opp_overig: number;
}
