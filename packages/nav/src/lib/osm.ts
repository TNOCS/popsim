/**
 * Created some (non-exhaustive) OSM types based on http://wiki.openstreetmap.org/wiki/Key:highway#Values
*/

export type HighwayType = 'cycleway'
  | 'footway'
  | 'pedestrian'
  | 'motorway'
  | 'trunk'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'motorway_link'
  | 'trunk_link'
  | 'primary_link'
  | 'secondary_link'
  | 'tertiary_link'
  | 'unclassified_link'
  | 'residential'
  | 'service'
  | 'living_street'
  | 'track'
  | 'bus_guideway'
  | 'escape'
  | 'raceway'
  | 'road'
  | 'bridleway'
  | 'steps'
  | 'path'
  | 'proposed'
  | 'construction'
  | 'bus_stop'
  | 'crossing'
  | 'elevator'
  | 'emergency_access_point'
  | 'give_way'
  | 'mini_roundabout'
  | 'motorway_junction'
  | 'passing_place'
  | 'rest_area'
  | 'speed_camera'
  | 'street_lamp'
  | 'services'
  | 'stop'
  | 'traffic_signals'
  | 'turning_circle';

export type SidewalkType = 'both' | 'left' | 'right' | 'no';

export type YesNoType = 'yes' | 'no';

export type CyclewayType = 'lane'
  | 'opposite'
  | 'opposite_lane'
  | 'track'
  | 'opposite_track'
  | 'share_busway'
  | 'opposite_share_busway'
  | 'shared_lane';

export type BuswayType = 'lane';

export type SurfaceType = 'paved'
  | 'unpaved'
  | 'asphalt'
  | 'concrete'
  | 'paving_stones'
  | 'cobblestone'
  | 'metal'
  | 'wood'
  | 'grass_paver'
  | 'gravel'
  | 'pebblestone'
  | 'grass'
  | 'ground'
  | 'earth'
  | 'dirt'
  | 'mud'
  | 'sand';

export type ServiceType = 'parking_aisle' | 'alley' | 'driveway' | 'emergency_access' | 'drive-through' | 'bus';

export type TunnelType = 'yes' | 'building_passage';

export type PsvType = 'opposite_lane';

export interface ITag {
  name?: string;
  'name:de'?: string;
  'name:nl'?: string;
  foot?: YesNoType;
  bicycle?: YesNoType;
  oneway?: YesNoType;
  'oneway:bus'?: YesNoType;
  lit?: YesNoType;
  tunnel?: TunnelType;
  highway?: HighwayType;
  cycleway?: CyclewayType;
  surface?: SurfaceType;
  maxspeed?: string;
  layer?: string;
  service?: ServiceType;
  source?: string;
  network?: string;
  route?: 'foot' | 'bicyle';
  type?: string;
  distance?: string;
  note?: string;
  psv: PsvType;
  ref?: string;
};
