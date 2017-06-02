import { ICensusProps } from './census-props';
import { FeatureCollection, Feature, Polygon, GeometryObject } from 'geojson';

export interface ICensusFeatureCollection extends FeatureCollection<GeometryObject> {
  requestId: number;
  type: 'FeatureCollection';
  features: Array<ICensusFeature>;
}

export interface ICensusFeature extends Feature<Polygon> {
  properties: ICensusProps;
}

export interface ICensusProps {
  aant_man: number;
  aant_vrouw: number;
  aantal_hh: number;
  aant_hh_z_k: number;
  aant_hh_m_k: number;
  aant_eenp_hh: number;
  aant_ongehuwd: number;
  aant_gescheid: number;
  aant_verweduw: number;
  aant_00_14_jr: number;
  aant_15_24_jr: number;
  aant_25_44_jr: number;
  aant_45_64_jr: number;
  aant_65_eo_jr: number;

  bu_code?: number;
  aant_inw: number;
  bev_dichth: number;
  aant_west_al: number;
  aant_n_w_al: number;
  aant_marokko: number;
  aant_turkije: number;
  aant_ant_aru: number;
  aant_surinam: number;
  aant_over_nw: number;
  buurt_ge: number;
}
