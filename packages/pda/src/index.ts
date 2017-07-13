import { ISimRequestMessage, IMessage, IPopulationMsg, logger, logError, ActivityManager, IPersonsMsg, IActivitiesMsg } from '@popsim/common';
import { Client, Consumer, Producer } from 'kafka-node';
import { config } from './lib/configuration';
import { EventEmitter } from 'events';
import { PdaService } from './lib/pda-service';

process.title = config.kafka.clientId;

const log = logger(config.logging);

class PdaEmitter extends EventEmitter { };
const ee = new PdaEmitter();

const store: {
  pop: { [key: number]: IPopulationMsg };
  sim: { [key: number]: ISimRequestMessage };
  done: number[];
} = {
    pop: {},
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
  const personsSender = (message: IPersonsMsg) => {
    const msg = JSON.stringify(message);
    const payloads = [{
      topic: options.persons.topic,
      partition: options.persons.partition,
      messages: msg
    }];
    log(`Sending message to topic ${options.persons.topic}/${options.persons.partition}:
    ${msg.substr(0, Math.min(msg.length, 1024))}`);
    producer.send(payloads, (err, data) => {
      if (err) { logError('>> PDA persons sender: ' + err); }
    });
  };

  const activitiesSender = (message: IActivitiesMsg) => {
    const msg = JSON.stringify(message);
    const payloads = [{
      topic: options.activities.topic,
      partition: options.activities.partition,
      messages: msg
    }];
    log(`Sending message to topic ${options.activities.topic}/${options.activities.partition}:
    ${msg.substr(0, Math.min(msg.length, 1024))}`);
    // fs.writeFileSync('activities.json', msg);
    producer.send(payloads, (err, data) => {
      if (err) { logError('>> PDA activities sender: ' + err); }
    });
  };

  producer.on('ready', () => {
    log(`Producer ready.`);
    producer.createTopics([options.activities.topic, options.persons.topic], true, (error, data: string[]) => {
      if (error) { return logError(error); }
      if (data) { log(`Successfully created topics: ${data.join(', ')}.`); }
    });
  });

  return { personsSender, activitiesSender, producer };
};

const setupAgenda = (personsSender: (msg: IPersonsMsg) => void, activitiesSender: (msg: IActivitiesMsg) => void) => {
  ee.on('messageReceived', (msg: { type: string; key: number }) => {
    const key = msg.key;
    log(`Type ${msg.type}, key ${key}`);
    if (store.done.indexOf(key) >= 0 || !store.pop.hasOwnProperty(key) || !store.sim.hasOwnProperty(key)) { return; }
    log(`All required data received. Starting to process`);
    store.done.push(key);
    const pop = store.pop[key];
    const sim = store.sim[key];
    const pdaSvc = new PdaService(sim, pop);
    pdaSvc.createAgendasAsync()
      .then(persons => {
        const activityManager = ActivityManager.getInstance();
        // pop.households.forEach(h => h.persons.forEach(p => log(activityManager.printAgenda(p.agenda)) ));
        personsSender(<IPersonsMsg> {
          requestId: pop.requestId,
          bbox: pop.bbox,
          persons: persons
        }); // should have been augmented with non-local persons (others)
        activitiesSender(<IActivitiesMsg> {
          requestId: pop.requestId,
          bbox: pop.bbox,
          activities: activityManager.getAll()
        }); // should have been augmented with non-local persons (others)
        log('Complete');
      });
  });
};

const { activitiesSender, personsSender,  producer } = setupProducers();
const consumer = setupConsumer();
setupAgenda(personsSender, activitiesSender);

process.on('SIGINT', function () {
  log('Caught interrupt signal');

  producer.close(() => {
    consumer.close(false, () => {
      process.exit();
    });
  });
});
