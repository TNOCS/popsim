import { ISimRequestMessage, IMessage, IPopulationMsg, IBuildingFeatureCollection, logger } from '@popsim/common';
import { Client, Consumer, Producer } from 'kafka-node';
import { config } from './lib/configuration';
import { EventEmitter } from 'events';
import { WorkforceService } from './lib/workforce-service';

process.title = 'workforce_service';

const log = logger(config.logging);
const logError = (msg: string | Object) => { if (msg) { logger(true, 'ERROR'); } };

class WorkforceEmitter extends EventEmitter { };
const ee = new WorkforceEmitter();

const store: {
  pop: { [key: number]: IPopulationMsg };
  bag: { [key: number]: IBuildingFeatureCollection };
  area: { [key: number]: ISimRequestMessage };
} = {
    pop: {},
    bag: {},
    area: {}
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
      case 'popChannel':
        log('Population message received.');
        const pop = <IPopulationMsg>JSON.parse(message.value);
        store.pop[pop.requestId] = pop;
        ee.emit('messageReceived', { type: 'cbs', key: pop.requestId });
        break;
      case 'areaChannel':
        log('Area message received.');
        const areaMessage = <ISimRequestMessage>JSON.parse(message.value);
        store.area[areaMessage.id] = areaMessage;
        ee.emit('messageReceived', { type: 'area', key: areaMessage.id });
        break;
      case 'bagChannel':
        log('BAG message received.');
        const bag = <IBuildingFeatureCollection>JSON.parse(message.value);
        if (bag.features && bag.features.length > 0) {
          store.bag[bag.requestId] = bag;
          ee.emit('messageReceived', { type: 'bag', key: bag.requestId });
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
  const populationSender = (msg: string) => {
    const payloads = [{
      topic: options.population.topic,
      partition: options.population.partition,
      messages: msg
    }];
    log(`Sending message to topic ${options.population.topic}/${options.population.partition}: ${msg.substr(0, Math.min(msg.length, 2048))}`);
    producer.send(payloads, (err, data) => logError(data));
  };

  const workforceSender = (msg: string) => {
    const payloads = [{
      topic: options.workforce.topic,
      partition: options.workforce.partition,
      messages: msg
    }];
    log(`Sending message to topic ${options.workforce.topic}/${options.workforce.partition}: ${msg.substr(0, Math.min(msg.length, 2048))}`);
    producer.send(payloads, (err, data) => logError(data));
  };

  producer.on('ready', () => {
    log(`Producer ready.`);
  });

  return { populationSender, workforceSender, producer };
};

const setupWorkforce = (populationSender: (msg: string) => void, workforceSender: (msg: string) => void) => {
  ee.on('messageReceived', (msg: { type: string; key: number }) => {
    const key = msg.key;
    log(`Type ${msg.type}, key ${key}`);
    if (!store.pop.hasOwnProperty(key) || !store.bag.hasOwnProperty(key)) { return; }
    log(`All required data received. Starting to process`);
    const bag = store.bag[key];
    const pop = store.pop[key];
    const wfsSvc = new WorkforceService(bag, pop);
    wfsSvc.getWorkforceAsync()
      .then(workplaces => {
        workforceSender(JSON.stringify(workplaces));
        populationSender(JSON.stringify(pop)); // should have been augmented with non-local persons (others)
        log('Complete');
      });
  });
};

const { populationSender, workforceSender,  producer } = setupProducer();
const consumer = setupConsumer();
setupWorkforce(populationSender, workforceSender);

process.on('SIGINT', function () {
  log('Caught interrupt signal');

  producer.close(() => {
    consumer.close(false, () => {
      process.exit();
    });
  });
});
