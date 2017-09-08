import { IWayElement, INodeElement, IRelationElement } from './overpass';
import { ITag } from './osm';

export interface IMemberType {
  type: 'way' | 'node';
  ref: number;
  role: '' | 'forward';
}

export interface IBaseElement {
  id: number;
  type: 'way' | 'relation' | 'node';
}

export interface IWayElement extends IBaseElement {
  type: 'way';
  nodes: number[];
  tags?: ITag;
}

export interface IRelationElement extends IBaseElement {
  type: 'relation';
  members: IMemberType[];
  tags?: ITag;
}

export interface INodeElement extends IBaseElement {
  type: 'node';
  lat: number;
  lon: number;
}

export interface IOverpass {
  version: string;
  generator: string;
  osm3s: {
    timestamp_osm_base: string;
    copyright: string;
  };
  elements: Array<IWayElement | INodeElement | IRelationElement>;
}
