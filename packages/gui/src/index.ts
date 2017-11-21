import { ISimRequestMessage, logger, logError } from '@popsim/common';
import { Client, Consumer, Producer } from 'kafka-node';
import { config } from './lib/configuration';
import * as websocket from 'websocket';
import * as http from 'http';

const log = logger(config.logging);

const WebSocketServer = websocket.server;
const server = http.createServer(function (request, response) {
  log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
});
server.listen(8080, function () {
  log((new Date()) + ' Server is listening on port 8080');
});

const wsServer = new WebSocketServer({
  httpServer: server,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false
});

const originIsAllowed = (origin: any) => {
  log(origin);
  // put logic here to detect whether the specified origin is allowed.
  return true;
};

wsServer.on('request', function (request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  const connection = request.accept('echo-protocol', request.origin);
  log((new Date()) + ' Connection accepted.');
  connection.on('message', (message: any) => {
    if (message.type === 'utf8') {
      log('Received Message: ' + message.utf8Data);
      connection.sendUTF(message.utf8Data);
    } else if (message.type === 'binary') {
      log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      connection.sendBytes(message.binaryData);
    }
  });
  connection.on('close', function (reasonCode, description) {
    log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});

process.title = config.kafka.clientId;

const conOpt = config.kafka;

const setupConsumer = (sender: (msg: string) => void) => {
  const options = conOpt.subscription;
  const topics = options.topics.map(t => t.topic);
  const client = new Client(conOpt.host, conOpt.clientId + '_client');
  const consumer = new Consumer(client, [], options.options);

  // Refresh the metadata and create the topics at the same time.
  client.refreshMetadata(topics, err => {
    if (err) { logError(err); }
    consumer.addTopics(topics, (error, added) => {
      if (error) { logError(error); }
      log(`Consumer ready, listening on ${topics.join(',')}.`);
    });
  });

  consumer.on('message', m => {
    switch (m.topic) {
      case 'timeChannel':
        log(`SIM TIME: ${m.value}`);
        break;
      default:
        log(JSON.stringify(m, null, 2).substr(0, 1024));
        break;
    }
  });

  consumer.on('error', (err: Error) => {
    logError(err);
  });

  log(`Consumer ready, listening on ${options.topics.map(s => s.topic).join(', ')}.`);
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
    log(`Sending message to topic ${options.area.topic}/${options.area.partition}:
    ${JSON.stringify(msg, null, 2).substr(0, 1024)}`);
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
  const simStart = new Date(2018, 0, 28, 7, 30, 0); // NOTE months start at 0
  const simEnd = new Date(2018, 0, 30);
  const newAreaEvent = {
    id: 1,
    start: simStart.valueOf(),
    end: simEnd.valueOf(),
    simulationStartTime: simStart.toJSON(),
    simulationEndTime: simEnd.toJSON(),
    bbox: [5.474495887756348, 51.44190471270124, 5.483808517456055, 51.43532386882376]
  } as ISimRequestMessage;
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
