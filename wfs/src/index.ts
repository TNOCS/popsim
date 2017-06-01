import { PopulationService } from './lib/population-service';
import { Client, Consumer, Producer } from 'kafka-node';
import { config } from './lib/configuration';
import { GeometryObject } from 'geojson';
import { EventEmitter } from 'events';

process.title = 'population_service';

const log = config.logging ? console.log : () => undefined;
const logError = console.error;

class PopulationEmitter extends EventEmitter { };
const ee = new PopulationEmitter();

const store: {
  cbs: { [key: string]: GeoJSON.FeatureCollection<GeometryObject> };
  bag: { [key: string]: GeoJSON.FeatureCollection<GeometryObject> };
} = {
    cbs: {},
    bag: {}
  };

const conOpt = config.kafka;

const setupConsumer = () => {
  const options = conOpt.subscription;
  const topics = conOpt.subscription.topics.map(t => t.topic);
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

  consumer.on('message', (message: IMessage) => {
    const topic = message.topic;
    switch (topic) {
      case 'cbsChannel':
        log('CBS message received.');
        const cbs = <GeoJSON.FeatureCollection<GeometryObject>>JSON.parse(message.value);
        if (cbs.features && cbs.features.length > 0) {
          const key = cbs.bbox ? cbs.bbox.join(', ') : 'undefined';
          store.cbs[key] = cbs;
          ee.emit('messageReceived', { type: 'cbs', key: key });
        }
        break;
      case 'bagChannel':
        log('BAG message received.');
        const bag = <GeoJSON.FeatureCollection<GeometryObject>>JSON.parse(message.value);
        if (bag.features && bag.features.length > 0) {
          const key = bag.bbox ? bag.bbox.join(', ') : 'undefined';
          store.bag[key] = bag;
          ee.emit('messageReceived', { type: 'bag', key: key });
          // log(bag.features[0]);
        }
        break;
      default:
        log('Unknown message:');
        log(message);
        break;
    }
    // sender(message);
  });

  consumer.on('error', (err: Error) => {
    logError(err);
  });

  log(`Consumer ready, listening on ${options.topics.map(s => s.topic).join(',')}.`);
  return consumer;
};

const setupProducer = () => {
  const client = new Client(conOpt.host, conOpt.clientId + '_producer');
  const producer = new Producer(client);

  producer.on('error', (err: Error) => {
    logError(err);
  });

  const options = config.kafka.publication;
  const sender = (msg: string) => {
    const payloads = [{
      topic: options.population.topic,
      partition: options.population.partition,
      messages: msg
    }];
    log(`Sending message to topic ${options.population.topic}/${options.population.partition}: ${msg}`);
    producer.send(payloads, (err, data) => logError(data));
  };

  producer.on('ready', () => {
    log(`Producer ready.`);
  });

  return { sender, producer };
};

const setupPopulator = (sender: (msg: string) => void) => {
  ee.on('messageReceived', (msg: { type: string; key: string }) => {
    const key = msg.key;
    log(`Type ${msg.type}, key ${key}`);
    if (!store.cbs.hasOwnProperty(key) || !store.bag.hasOwnProperty(key)) { return; }
    log(`All required data received. Starting to process`);
    const popSvc = new PopulationService(store.cbs[key], store.bag[key]);
    popSvc.getPopulationAsync()
      .then(households => {
        sender(JSON.stringify(households));
        log('Complete');
      });
  });
};

const { sender, producer } = setupProducer();
const consumer = setupConsumer();
setupPopulator(sender);

process.on('SIGINT', function () {
  log('Caught interrupt signal');

  producer.close(() => {
    consumer.close(false, () => {
      process.exit();
    });
  });
});
