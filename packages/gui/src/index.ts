import { IAreaMessage } from '@popsim/common';
import { Client, Consumer, Producer } from 'kafka-node';
import { config } from './lib/configuration';

const log = config.logging ? console.log : () => { };
const logError = console.error;

const conOpt = config.kafka;

const setupConsumer = (sender: (msg: string) => void) => {
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

  consumer.on('message', (message: string) => {
    log(message);
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
      topic: options.area.topic,
      partition: options.area.partition,
      messages: msg
    }];
    log(`Sending message to topic ${options.area.topic}/${options.area.partition}: ${msg}`);
    producer.send(payloads, (err, data) => logError(data));
  };

  producer.on('ready', () => {
    log(`Producer ready.`);
  });

  return { sender, producer };
};

const { sender, producer } = setupProducer();
const consumer = setupConsumer(sender);

setTimeout(() => {
  const newAreaEvent = <IAreaMessage>{
    id: 1,
    simulationStartTime: { hour: 6, min: 0, day: 'mo' },
    simulationEndTime: { hour: 6, min: 0, day: 'tu' },
    bbox: [5.474495887756348, 51.44190471270124, 5.483808517456055, 51.43532386882376]
  };
  sender(JSON.stringify(newAreaEvent));
}, 2000);

process.on('SIGINT', function () {
  log('Caught interrupt signal');

  producer.close(() => {
    consumer.close(true, () => {
      process.exit();
    });
  });
});

// var kafka = require('kafka-node'),
//     Producer = kafka.Producer,
//     KeyedMessage = kafka.KeyedMessage,
//     client = new kafka.Client(),
//     producer = new Producer(client),
//     km = new KeyedMessage('key', 'message'),
//     payloads = [
//         { topic: 'topic1', messages: 'hi', partition: 0 },
//         { topic: 'topic2', messages: ['hello', 'world', km] }
//     ];
// producer.on('ready', function () {
//     producer.send(payloads, function (err, data) {
//         console.log(data);
//     });
// });

// producer.on('error', function (err) {
//     console.error(err);
// })
