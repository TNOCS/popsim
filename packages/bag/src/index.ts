import { ISimRequestMessage, IMessage, IBuildingFeatureCollection, logger, logError } from '@popsim/common';
import { Client, Consumer, Producer, ProduceRequest } from 'kafka-node';
import { config } from './lib/configuration';
import * as pg2bag from './lib/pg2bag';

process.title = config.kafka.clientId;
const log = logger(config.logging);

const conOpt = config.kafka;

const setupBagSvc = () => {
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
    const geojson: IBuildingFeatureCollection = await pg2bag.queryPanden(bboxWkt);
    // log(JSON.stringify(geojson, null, 2));
    return geojson;
  };
  return query;
};

const setupConsumer = (svc: (bbox: number[]) => Promise<IBuildingFeatureCollection>, send: (msg: string) => void) => {
  const options = conOpt.subscription;
  const topics = options.topics.map(t => t.topic);
  const client = new Client(conOpt.host, conOpt.clientId + '_client');
  const consumer = new Consumer(client, [], options.options);

  client.refreshMetadata(topics, (err, resp) => {
    if (err) { logError(err); }
    consumer.addTopics(topics, (error, added) => {
      if (error) { logError(error); }
      log(`Consumer ready, listening on ${topics.join(', ')}.`);
    });
  });

  consumer.on('message', async (message: IMessage) => {
    const topic = message.topic;
    switch (topic) {
      case 'simChannel':
        const msg = <ISimRequestMessage> JSON.parse(message.value);
        const geojson = await svc(msg.bbox);
        geojson.bbox = msg.bbox;
        geojson.requestId = msg.id;
        send(JSON.stringify(geojson));
        break;
      default:
        logError(`Message received on unknown topic ${topic}: ${JSON.stringify(message, null, 2)}`);
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

  const options = config.kafka.publication.bag;
  const send = (msg: string) => {
    const payloads: ProduceRequest[] = [{
      topic: options.topic,
      partition: options.partition,
      messages: msg,
      attributes: 1
    }];
    producer.send(payloads, (err, data) => logError(data));
  };

  return send;
};

const bagSvc = setupBagSvc();
const sender = setupProducer();
setupConsumer(bagSvc, sender);
