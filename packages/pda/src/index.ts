import { ISimRequestMessage, IMessage, IPopulationMsg, IWorkforceMsg, logger, logError, ActivityManager } from '@popsim/common';
import { Client, Consumer, Producer } from 'kafka-node';
import { config } from './lib/configuration';
import { EventEmitter } from 'events';
import { PdaService } from './lib/pda-service';

process.title = 'pda_service';

const log = logger(config.logging);

class PdaEmitter extends EventEmitter { };
const ee = new PdaEmitter();

const store: {
  pop: { [key: number]: IPopulationMsg };
  wfs: { [key: number]: IWorkforceMsg };
  sim: { [key: number]: ISimRequestMessage };
  done: number[];
} = {
    pop: {},
    wfs: {},
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
      if (error) { return logError(error); }
      log(`Consumer ready, listening on ${topics.join(', ')}.`);
    });
  });

  consumer.on('message', (message: IMessage) => {
    const topic = message.topic;
    switch (topic) {
      case 'pop2Channel':
        log('Population message received.');
        const pop = <IPopulationMsg>JSON.parse(message.value);
        if (store.pop.hasOwnProperty(pop.requestId)) { return; }
        store.pop[pop.requestId] = pop;
        ee.emit('messageReceived', { type: 'pop', key: pop.requestId });
        break;
      case 'simChannel':
        log('Simulation request message received.');
        const sim = <ISimRequestMessage>JSON.parse(message.value);
        if (store.sim.hasOwnProperty(sim.id)) { return; }
        store.sim[sim.id] = sim;
        ee.emit('messageReceived', { type: 'sim', key: sim.id });
        break;
      case 'wfsChannel':
        log('WFS message received.');
        const wfs = <IWorkforceMsg>JSON.parse(message.value);
        if (wfs.workplaces && wfs.workplaces.length > 0) {
          if (store.wfs.hasOwnProperty(wfs.requestId)) { return; }
          store.wfs[wfs.requestId] = wfs;
          ee.emit('messageReceived', { type: 'wfs', key: wfs.requestId });
          // log(bag.workplaces[0]);
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
    const payloads = [{
      topic: options.population.topic,
      partition: options.population.partition,
      messages: msg
    }];
    log(`Sending message to topic ${options.population.topic}/${options.population.partition}:
    ${msg.substr(0, Math.min(msg.length, 1024))}`);
    producer.send(payloads, (err, data) => {
      if (err) { logError('>> PDA population sender: ' + err); }
    });
  };

  const workforceSender = (msg: string) => {
    const payloads = [{
      topic: options.workforce.topic,
      partition: options.workforce.partition,
      messages: msg
    }];
    log(`Sending message to topic ${options.workforce.topic}/${options.workforce.partition}:
    ${msg.substr(0, Math.min(msg.length, 1024))}`);
    producer.send(payloads, (err, data) => {
      if (err) { logError('>> PDA workforce sender: ' + err); }
    });
  };

  producer.on('ready', () => {
    log(`Producer ready.`);
  });

  return { populationSender, workforceSender, producer };
};

const setupAgenda = (populationSender: (msg: string) => void, workforceSender: (msg: string) => void) => {
  ee.on('messageReceived', (msg: { type: string; key: number }) => {
    const key = msg.key;
    log(`Type ${msg.type}, key ${key}`);
    if (store.done.indexOf(key) >= 0 || !store.pop.hasOwnProperty(key) || !store.wfs.hasOwnProperty(key) || !store.sim.hasOwnProperty(key)) { return; }
    log(`All required data received. Starting to process`);
    store.done.push(key);
    // const wfs = store.wfs[key];
    const pop = store.pop[key];
    const sim = store.sim[key];
    const pdaSvc = new PdaService(sim, pop);
    pdaSvc.createAgendasAsync()
      .then(workplaces => {
        // workforceSender(JSON.stringify(workplaces));
        const activityManager = ActivityManager.getInstance();
        pop.households.forEach(h => h.persons.forEach(p => log(activityManager.printAgenda(p.agenda)) ));
        populationSender(JSON.stringify(pop)); // should have been augmented with non-local persons (others)
        log('Complete');
      });
  });
};

const { populationSender, workforceSender,  producer } = setupProducer();
const consumer = setupConsumer();
setupAgenda(populationSender, workforceSender);

process.on('SIGINT', function () {
  log('Caught interrupt signal');

  producer.close(() => {
    consumer.close(false, () => {
      process.exit();
    });
  });
});
