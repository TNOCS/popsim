import { IBuildingFeatureCollection, ISimRequestMessage, IMessage, logger, logError, IPedestrianMapMsg, IPedestrianGraphMsg } from '@popsim/common';
import { Client, Consumer, Producer } from 'kafka-node';
import { config } from './lib/configuration';
import { EventEmitter } from 'events';
import { NavService } from './lib/nav-service';

process.title = config.kafka.clientId;

const log = logger(config.logging);

class PdaEmitter extends EventEmitter { };
const ee = new PdaEmitter();

const store: {
  bag: { [key: number]: IBuildingFeatureCollection };
  sim: { [key: number]: ISimRequestMessage };
} = {
    bag: {},
    sim: {}
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
      if (error) { return logError(error); }
      log(`Consumer ready, listening on ${topics.join(', ')}.`);
    });
  });

  consumer.on('message', (message: IMessage) => {
    const topic = message.topic;
    switch (topic) {
      case 'bagChannel':
        log('BAG message received.');
        const bag = <IBuildingFeatureCollection>JSON.parse(message.value);
        if (store.bag.hasOwnProperty(bag.requestId)) { return; }
        store.bag[bag.requestId] = bag;
        ee.emit('messageReceived', { type: 'bag', key: bag.requestId });
        break;
      case 'simChannel':
        log('Simulation request message received.');
        const sim = <ISimRequestMessage>JSON.parse(message.value);
        if (store.sim.hasOwnProperty(sim.id)) { return; }
        store.sim[sim.id] = sim;
        ee.emit('messageReceived', { type: 'sim', key: sim.id });
        break;
      default:
        log(`Unknown message: ${topic}`);
        log(JSON.stringify(message, null, 2).substr(0, 1024));
        break;
    }
    // sender(message);
  });

  consumer.on('error', (err: Error) => {
    logError(err);
  });

  return consumer;
};

const setupProducers = () => {
  const client = new Client(conOpt.host, conOpt.clientId + '_producer');
  const producer = new Producer(client);

  producer.on('error', (err: Error) => {
    logError(err);
  });

  const options = config.kafka.publication;
  const navSender = (message: IPedestrianMapMsg) => {
    const msg = JSON.stringify(message);
    const payloads = [{
      topic: options.map.topic,
      partition: options.map.partition,
      messages: msg
    }];
    log(`Sending message to topic ${options.map.topic}/${options.map.partition}:
    ${msg.substr(0, Math.min(msg.length, 1024))}`);
    producer.send(payloads, (err, data) => {
      if (err) { logError('>> NAV map sender: ' + err); }
    });
  };

  const graphSender = (message: IPedestrianGraphMsg) => {
    const msg = JSON.stringify(message);
    const payloads = [{
      topic: options.nav.topic,
      partition: options.nav.partition,
      messages: msg
    }];
    log(`Sending message to topic ${options.nav.topic}/${options.nav.partition}:
    ${msg.substr(0, Math.min(msg.length, 1024))}`);
    producer.send(payloads, (err, data) => {
      if (err) { logError('>> NAV nav sender: ' + err); }
    });
  };

  producer.on('ready', () => {
    log(`Producer ready.`);
    producer.createTopics([options.nav.topic], true, (error, data: string[]) => {
      if (error) { return logError(error); }
      if (data) { log(`Successfully created topics: ${data.join(', ')}.`); }
    });
  });

  return { navSender, graphSender, producer };
};

const setupNavigationMapSvc = (navSender: (msg: IPedestrianMapMsg) => void, graphSender: (msg: IPedestrianGraphMsg) => void) => {
  ee.on('messageReceived', (msg: { type: string; key: number }) => {
    const key = msg.key;
    log(`Type ${msg.type}, key ${key}`);
    if (!store.bag.hasOwnProperty(key) || !store.sim.hasOwnProperty(key)) { return; }
    log(`All required data received. Starting to process`);
    const bag = store.bag[key];
    const navSvc = new NavService(bag);
    navSvc.createNavigationMapAsync()
      .then(result => {
        navSender({
          requestId: bag.requestId,
          bbox: bag.bbox,
          map: result.geojson
        });
        graphSender({
          requestId: bag.requestId,
          bbox: bag.bbox,
          graph: result.graph
        });
        log('Complete');
      });
  });
};

const { navSender, graphSender, producer } = setupProducers();
const consumer = setupConsumer();
setupNavigationMapSvc(navSender, graphSender);

process.on('SIGINT', function () {
  log('Caught interrupt signal');

  producer.close(() => {
    consumer.close(false, () => {
      process.exit();
    });
  });
});
