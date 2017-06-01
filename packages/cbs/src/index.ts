import { Client, Consumer, Producer } from 'kafka-node';
import { FeatureCollection, GeometryObject, Feature, Polygon } from 'GeoJSON';
import * as area from '@turf/area';
import { config } from './lib/configuration';
import * as pg2cbs from './lib/pg2cbs';

const log = config.logging ? console.log : () => { return; };
const logError = console.error;

const conOpt = config.kafka;

const setupCbsSvc = () => {
  /**
   * Query the BAG PostGIS database.
   *
   * @param {number[]} bbox: x1 (lon), y1 (lat), x2, y2, i.e. top-left and bottom-right coordinates in WGS84
   * @returns
   */
  const query = async (bbox: number[]) => {
    const x1 = bbox[0];
    const y1 = bbox[1];
    const x2 = bbox[2];
    const y2 = bbox[3];
    const bboxWkt = `POLYGON((
      ${x1} ${y1},
      ${x2} ${y1},
      ${x2} ${y2},
      ${x1} ${y2},
      ${x1} ${y1}
    ))`;
    const geojson: FeatureCollection<GeometryObject> = await pg2cbs.queryCbs(bboxWkt);
    if (!geojson.features) { return geojson; }
    const props: { [key: string]: number } = {};
    const summary = <Feature<Polygon>>{
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [x1, y1],
          [x2, y1],
          [x2, y2],
          [x1, y2],
          [x1, y1]
        ]]
      },
      properties: props
    };
    geojson.features.forEach(f => {
      if (!f.properties) { return; }
      const buurtGeom = (<{ buurt_geom: any }>f.properties).buurt_geom;
      const areaOverlap = area(f);
      const areaOriginal = area(<Feature<GeometryObject>>{
        type: 'Feature',
        geometry: buurtGeom
      });
      const pOverlap = areaOverlap / areaOriginal;
      for (let key in f.properties) {
        if (f.properties.hasOwnProperty(key) && key.indexOf('aant') >= 0) {
          if (!props.hasOwnProperty(key)) { props[key] = 0; }
          props[key] += pOverlap * (<{ [key: string]: number }>f.properties)[key];
        }
      }
    });
    for (let key in props) { if (props.hasOwnProperty(key)) { props[key] = Math.round(props[key]); } }
    geojson.features.splice(0, 0, summary);
    // log(JSON.stringify(geojson, null, 2));
    return geojson;
  };
  return query;
};

const setupConsumer = (svc: (bbox: number[]) => Promise<FeatureCollection<GeometryObject>>, send: (msg: string) => void) => {
  const options = conOpt.subscription;
  const topics = options.topics.map(t => t.topic);
  const client = new Client(conOpt.host, conOpt.clientId + '_client');
  const consumer = new Consumer(client, [], options.options);

  // Refresh the metadata and create the topics at the same time.
  client.refreshMetadata(topics, (err, resp) => {
    if (err) { logError(err); }
    consumer.addTopics(topics, (error, added) => {
      if (error) { logError(error); }
      log(`Consumer ready, listening on ${topics.join(',')}.`);
    });
  });

  consumer.on('message', async (message: { topic: string; value: string }) => {
    const topic = message.topic;
    switch (topic) {
      case 'areaChannel':
        const msg: { id: string; bbox: number[] } = JSON.parse(message.value);
        const geojson = await svc(msg.bbox);
        geojson.bbox = msg.bbox;
        send(JSON.stringify(geojson));
        break;
      default:
        log(`Message received on unknown topic ${topic}: ${JSON.stringify(message, null, 2)}`);
        break;
    }
  });

  consumer.on('error', (err: Error) => {
    logError(err);
  });
};

const setupProducer = () => {
  const client = new Client(conOpt.host, conOpt.clientId + '_producer');
  const producer = new Producer(client);

  producer.on('ready', () => {
    log(`Producer ready.`);
  });

  producer.on('error', (err: Error) => {
    logError(err);
  });

  const options = config.kafka.publication.cbs;
  const send = (msg: string) => {
    const payloads = [{
      topic: options.topic,
      partition: options.partition,
      messages: msg
    }];
    producer.send(payloads, (err, data) => logError(data));
  };

  return send;
};

const cbsSvc = setupCbsSvc();
const sender = setupProducer();
setupConsumer(cbsSvc, sender);
