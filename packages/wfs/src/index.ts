import { ISimRequestMessage, IMessage, IPopulationMsg, IBuildingFeatureCollection, logger, logError, IWorkforceMsg } from '@popsim/common';
import { Client, ProduceRequest, Consumer, Producer } from 'kafka-node';
import { config } from './lib/configuration';
import { EventEmitter } from 'events';
import { WorkforceService } from './lib/workforce-service';

process.title = config.kafka.clientId;

const log = logger(config.logging);

class WorkforceEmitter extends EventEmitter { };
const ee = new WorkforceEmitter();

const store: {
  pop: { [key: number]: IPopulationMsg };
  bag: { [key: number]: IBuildingFeatureCollection };
  sim: { [key: number]: ISimRequestMessage };
  done: number[]
} = {
    pop: {},
    bag: {},
    sim: {},
    done: []
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
      log(`Consumer ready, listening on ${topics.join(', ')}.`);
    });
  });

  consumer.on('message', (message: IMessage) => {
    const topic = message.topic;
    switch (topic) {
      case 'popChannel':
        log('Population message received.');
        const pop = <IPopulationMsg>JSON.parse(message.value);
        if (store.pop.hasOwnProperty(pop.requestId)) { return; }
        store.pop[pop.requestId] = pop;
        ee.emit('messageReceived', { type: 'cbs', key: pop.requestId });
        break;
      case 'simChannel':
        log('Sim request message received.');
        const sim = <ISimRequestMessage>JSON.parse(message.value);
        if (store.sim.hasOwnProperty(sim.id)) { return; }
        store.sim[sim.id] = sim;
        ee.emit('messageReceived', { type: 'sim', key: sim.id });
        break;
      case 'bagChannel':
        log('BAG message received.');
        const bag = <IBuildingFeatureCollection>JSON.parse(message.value);
        if (bag.features && bag.features.length > 0) {
          if (store.bag.hasOwnProperty(bag.requestId)) { return; }
          store.bag[bag.requestId] = bag;
          ee.emit('messageReceived', { type: 'bag', key: bag.requestId });
          // log(bag.features[0]);
        }
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

const setupProducer = () => {
  const client = new Client(conOpt.host, conOpt.clientId + '_producer');
  const producer = new Producer(client);

  producer.on('error', (err: Error) => {
    logError(err);
  });

  const options = config.kafka.publication;
  const populationSender = (msg: string) => {
    const payloads: ProduceRequest[] = [{
      topic: options.population.topic,
      partition: options.population.partition,
      messages: msg,
      attributes: 1
    }];
    log(`Sending message to topic ${options.population.topic}/${options.population.partition}:
    ${msg.substr(0, 1024)}`);
    producer.send(payloads, (err, data) => {
      if (err) {
        logError(err);
      } else {
        log(`Result:\n${JSON.stringify(data, null, 2)}`);
      }
    });
  };

  const workforceSender = (msg: string) => {
    const payloads: ProduceRequest[] = [{
      topic: options.workforce.topic,
      partition: options.workforce.partition,
      messages: msg,
      attributes: 1
    }];
    log(`Sending message to topic ${options.workforce.topic}/${options.workforce.partition}:
    ${msg.substr(0, 1024)}`);
    producer.send(payloads, (err, data) => {
      if (err) {
        logError(err);
      } else {
        log(`Result:\n${JSON.stringify(data, null, 2)}`);
      }
    });
  };

  producer.on('ready', () => {
    log(`Producer ready.`);
    producer.createTopics([options.workforce.topic, options.population.topic], true, (error, data) => {
      if (error) { return logError(error); }
      if (data) { log(data); }
    });
  });

  return { populationSender, workforceSender, producer };
};

const setupWorkforce = (populationSender: (msg: string) => void, workforceSender: (msg: string) => void) => {
  ee.on('messageReceived', (msg: { type: string; key: number }) => {
    const key = msg.key;
    log(`Type ${msg.type}, key ${key}`);
    if (store.done.indexOf(key) >= 0 || !store.pop.hasOwnProperty(key) || !store.bag.hasOwnProperty(key)) { return; }
    log(`All required data received. Starting to process`);
    store.done.push(key);
    const bag = store.bag[key];
    const pop = store.pop[key];
    const wfsSvc = new WorkforceService(bag, pop);
    wfsSvc.getWorkforceAsync()
      .then(workplaces => {
        workforceSender(JSON.stringify(<IWorkforceMsg>{
          requestId: bag.requestId,
          bbox: bag.bbox,
          workplaces: workplaces
        }));
        populationSender(JSON.stringify(pop)); // should have been augmented with non-local persons (others)
        log('Complete');
      });
  });
};

const { populationSender, workforceSender, producer } = setupProducer();
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
