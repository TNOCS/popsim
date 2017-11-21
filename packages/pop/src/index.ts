import { ICensusFeatureCollection, IBuildingFeatureCollection, IPopulationMsg, logger, logError } from '@popsim/common/dist';
import { PopulationService } from './lib/population-service';
import { Client, Consumer, Producer, Message } from 'kafka-node';
import { config } from './lib/configuration';
import { EventEmitter } from 'events';

process.title = config.kafka.clientId;

const log = logger(config.logging);

class PopulationEmitter extends EventEmitter { };
const ee = new PopulationEmitter();

const store: {
  cbs: { [key: number]: ICensusFeatureCollection };
  bag: { [key: number]: IBuildingFeatureCollection };
  done: number[];
} = {
    cbs: {},
    bag: {},
    done: []
  };

const conOpt = config.kafka;

const setupConsumer = () => {
  const options = conOpt.subscription;
  const topics = conOpt.subscription.topics.map(t => t.topic);
  const client = new Client(conOpt.host, conOpt.clientId + '_client');
  const consumer = new Consumer(client, [], options.options);

  // Refresh the metadata and create the topics at the same time.
  client.refreshMetadata(topics, err => {
    if (err) { logError(err); }
    consumer.addTopics(topics, (error, added) => {
      if (error) { logError(error); }
      log(`Consumer ready, listening on ${topics.join(', ')}.`);
    });
  });

  consumer.on('message', (message: Message) => {
    const topic = message.topic;
    switch (topic) {
      case 'cbsChannel':
        log('CBS message received.');
        const cbs = <ICensusFeatureCollection>JSON.parse(message.value);
        if (cbs.features && cbs.features.length > 0) {
          const key = cbs.requestId;
          if (store.cbs.hasOwnProperty(key)) { return; }
          store.cbs[key] = cbs;
          ee.emit('messageReceived', { type: 'cbs', key: key });
        }
        break;
      case 'bagChannel':
        log('BAG message received.');
        const bag = <IBuildingFeatureCollection>JSON.parse(message.value);
        if (bag.features && bag.features.length > 0) {
          const key = bag.requestId;
          if (store.bag.hasOwnProperty(key)) { return; }
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
    log(`Sending message to topic ${options.population.topic}/${options.population.partition}:
    ${JSON.stringify(msg, null, 2).substr(0, 1024)}`);
    producer.send(payloads, (err, data) => logError(data));
  };

  producer.on('ready', () => {
    log(`Producer ready.`);
  });

  return { sender, producer };
};

const setupPopulator = (sender: (msg: string) => void) => {
  ee.on('messageReceived', (msg: { type: string; key: number }) => {
    const key = msg.key;
    log(`Type ${msg.type}, key ${key}`);
    if (store.done.indexOf(key) >= 0 || !store.cbs.hasOwnProperty(key) || !store.bag.hasOwnProperty(key)) { return; }
    log(`All required data received. Starting to process`);
    store.done.push(key);
    const popSvc = new PopulationService(store.cbs[key], store.bag[key]);
    popSvc.getPopulationAsync()
      .then(households => {
        sender(JSON.stringify(<IPopulationMsg>{
          requestId: key,
          bbox: store.cbs[key].bbox,
          households: households
        }));
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
