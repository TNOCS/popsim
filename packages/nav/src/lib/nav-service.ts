import { ICytoscapeElement, ICytoscapeNodeElement, ICytoscapeEdgeElement } from './cytoscape';
import { IOverpass } from './overpass';
import * as fs from 'fs';
import { FeatureCollection, MultiPolygon } from 'geojson';
import { config } from './configuration';
import * as union from '@turf/union';
import * as request from 'request';
import { IBuildingFeatureCollection, logError } from '@popsim/common';
import { log } from 'util';
import { OsmToGeoJSON, OsmJSON } from 'osmtogeojson';
// tslint:disable-next-line:no-var-requires
const osmtogeojson: OsmToGeoJSON = require('osmtogeojson');

export class NavService {
  constructor(private bag: IBuildingFeatureCollection) { }

  public async createNavigationMapAsync() {
    const ways = await this.getPedestrianRoadsInformation();
    fs.writeFile('overpass.json', JSON.stringify(ways, null, 2), err => logError(err));
    const geojson = <GeoJSON.FeatureCollection<GeoJSON.GeometryObject>>osmtogeojson(ways);
    fs.writeFile('overpass.geojson', JSON.stringify(geojson, null, 2), err => logError(err));
    const graph = this.convertOverpassToGraph(<IOverpass>ways);
    fs.writeFile('cytoscape.json', JSON.stringify(graph, null, 2), err => logError(err));
    const map = await this.createNavigationMap();
    map.features.forEach(f => {
      f.properties = { weight: -1 };
      geojson.features.push(f);
    });
    fs.writeFile('map.geojson', JSON.stringify(geojson, null, 2), err => logError(err));
    return { geojson, graph };
  }

  private convertOverpassToGraph(data: IOverpass) {
    const elements: ICytoscapeElement[] = [];
    const createEdge = (id: number, index: number, [first, ...nodes]: number[]) => {
      const second = nodes[0];
      elements.push(<ICytoscapeEdgeElement>{
        group: 'edges',
        data: {
          id: `${id}-${index}a`,
          source: first.toString(),
          target: second.toString()
        }
      });
      // reverse direction
      elements.push(<ICytoscapeEdgeElement>{
        group: 'edges',
        data: {
          id: `${id}-${index}b`,
          source: second.toString(),
          target: first.toString()
        }
      });
      if (nodes && nodes.length > 1) { createEdge(id, ++index, nodes); }
    };
    data.elements.forEach(el => {
      switch (el.type) {
        case 'way':
          if (el.nodes) { createEdge(el.id, 0, el.nodes); }
          break;
        case 'relation':
          break;
        case 'node':
          elements.push(<ICytoscapeNodeElement>{
            group: 'nodes',
            data: {
              id: el.id.toString()
            },
            position: { x: el.lon, y: el.lat }
          });
          break;
        default:
          logError(`Unknown type: ${JSON.stringify(el, null, 2)}`);
          break;
      }
    });
    return elements;
  }

  private async getPedestrianRoadsInformation() {
    if (!this.bag.bbox) { throw Error('No bounding box found in the BAG message. Exiting.'); }
    const bb = this.bag.bbox;
    const bbox = `${bb[3]},${bb[0]},${bb[1]},${bb[2]}`;
    const url = config.overpass.url;
    const query = config.overpass.query.join('\n').replace(/{{bbox}}/g, bbox);
    return new Promise<OsmJSON.OsmJSONObject>((resolve, reject) => {
      request.post({
        url: url,
        body: query,
        form: false,
        timeout: 300000,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'cache-control': 'no-cache'
        }
      }, (error, response, body: string) => {
        if (response && response.statusCode !== 200) {
          reject(`Error posting query: ${response.statusCode}.`);
        } else if (body) {
          log(body.substr(0, 1024));
          const data: OsmJSON.OsmJSONObject = JSON.parse(body);
          resolve(data);
        } else {
          reject(`No data received.`);
        }
      });
    });
  }

  /**
   * Creates agendas for our population.
   *
   * @private
   * @returns
   *
   * @memberof NavService
   */
  private async createNavigationMap() {
    log('Starting to merge features...');
    const newMap = <FeatureCollection<MultiPolygon>>{
      type: 'FeatureCollection',
      features: await [union(...this.bag.features)]
    };
    log('Finished merging features');
    fs.writeFile('map.json', JSON.stringify(newMap), err => logError);
    return newMap;
  }
}
