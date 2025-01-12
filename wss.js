const WebSocket = require('ws');

const locationId = 4;
const ws = new WebSocket(`ws://localhost:5001?locationId=${locationId}`);

ws.on('open', () => {
  console.log('Connected to WebSocket server');
  ws.send(JSON.stringify({ username: 'TestUser', message: 'Hello from client!', createdAt: new Date().toISOString() }));
});

ws.on('message', (data) => {
  console.log('Message from server:', JSON.parse(data));
});

ws.on('close', (code, reason) => {
  console.log(`WebSocket closed: ${code}, ${reason}`);
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err);
});
