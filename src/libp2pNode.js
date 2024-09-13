import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { kadDHT } from '@libp2p/kad-dht';
import { identify } from '@libp2p/identify';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { webRTC } from '@libp2p/webrtc';
import { pipe } from 'it-pipe';
import { fromString, toString } from 'uint8arrays';

const node = await createLibp2p({
  transports: [
    circuitRelayTransport(),
    webSockets(),
    webRTC()
  ],
  connectionEncryption: [noise()],
  streamMuxers: [yamux()],
  services: {
    dht: kadDHT(),
    pubsub: gossipsub(),
    identify: identify(),
  }
});


await node.start();
console.log('Libp2p node started');
console.log('DHT service:', node.services.dht);


node.addEventListener('peer:connect', (evt) => {
  const peerId = evt.detail;
  console.log('Connected to:', peerId.toString());
});

node.addEventListener('peer:disconnect', (evt) => {
  const peerId = evt.detail;
  console.log('Disconnected from:', peerId.toString());
});

setInterval(() => {
  console.log('Routing Table Peers:', node.services.dht.routingTable.peers);
}, 5000);

const checkDHTConnection = () => {
  console.log('DHT Routing Table:', node.services.dht.routingTable);
  console.log('Connected peers:', node.getPeers());
};

setInterval(checkDHTConnection, 10000);

const advertiseRoom = async (roomId) => {
  const roomKey = `/rooms/${roomId}`;
  console.log('Your node peer ID:', node.peerId.toString());
  await node.services.dht.provide(roomKey);
  console.log(`Room ${roomId} advertised with key ${roomKey}`);

  try {
    const closestPeers = await node.services.dht.getClosestPeers(roomKey);
    console.log('Closest peers:', closestPeers);
  } catch (error) {
    console.error('Error finding closest peers:', error);
  }
};

const joinRoom = async (roomId) => {
  const roomKey = `/rooms/${roomId}`;
  console.log('Your node peer ID:', node.peerId.toString());
  console.log(`Searching for providers of ${roomKey}...`);

  try {
    const peers = await node.services.dht.findProviders(roomKey);
    if (!Array.isArray(peers) || peers.length === 0) {
      console.error(`No peers found for room ${roomId}`);
      return [];
    }
    console.log(`Found ${peers.length} peers for room ${roomId}`);
    peers.forEach(peer => {
      console.log(`Discovered peer: ${peer.id.toString()}`);
    });
    return peers;
  } catch (error) {
    console.error('Error during peer discovery:', error);
    return [];
  }
};

const handleChat = async ({ stream }) => {
  await pipe(
    stream.source,
    async function (source) {
      for await (const msg of source) {
        console.log(`Received message: ${toString(msg)}`);
        const chatLog = document.getElementById('chatLog');
        const li = document.createElement('li');
        li.textContent = `Peer: ${toString(msg)}`;
        chatLog.appendChild(li);
      }
    }
  );
};



window.createRoom = (roomId) => {
  console.log('Room ID for Create Room:', roomId);
  advertiseRoom(roomId);
};

window.joinRoom = (roomId) => {
  console.log('Room ID for Join Room:', roomId);
  joinRoom(roomId);
};
