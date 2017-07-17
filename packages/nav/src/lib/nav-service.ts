import * as fs from 'fs';
import { FeatureCollection, MultiPolygon, GeometryObject } from 'geojson';
import { config } from './configuration';
import * as union from '@turf/union';
import * as request from 'request';
import { IBuildingFeatureCollection, logError } from '@popsim/common';
import { log } from 'util';

export class NavService {
  constructor(private bag: IBuildingFeatureCollection) { }

  public async createNavigationMapAsync() {
    const ways = await this.getPedestrianRoadsInformation();
    fs.writeFile('overpass.json', ways, err => logError(err));
    return ways;
    // let navMap = <FeatureCollection<GeometryObject>>{};
    // await Promise
    //   .all([this.getPedestrianRoadsInformation(), this.createNavigationMap()])
    //   .then(collections => {
    //     navMap = collections[0];
    //     const map = collections[1];
    //     map.features.forEach(f => {
    //       f.properties = { weight: -1 };
    //       navMap.features.push(f);
    //     });
    //   });
    // return navMap;
  }

  private async getPedestrianRoadsInformation() {
    if (!this.bag.bbox) { throw Error('No bounding box found in the BAG message. Exiting.'); }
    const bb = this.bag.bbox;
    const bbox = `${bb[3]},${bb[0]},${bb[1]},${bb[2]}`;
    const url = config.overpass.url;
    const query = config.overpass.query.join('\n').replace(/{{bbox}}/g, bbox);
    return new Promise<FeatureCollection<GeometryObject>>((resolve, reject) => {
      request.post({
        url: url,
        body: query,
        form: false,
        timeout: 300000,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'cache-control': 'no-cache'
        }
      }, (error, response, body: FeatureCollection<GeometryObject>) => {
        if (response && response.statusCode !== 200) {
          reject(`Error posting query: ${response.statusCode}.`);
        } else if (body) {
          log(JSON.stringify(body, null, 2).substr(0, 1024));
          resolve(body);
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
