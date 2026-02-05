import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage
const polls = new Map();
const subscribers = new Map(); // pollId -> Set of WebSocket clients

// Broadcast poll update to all subscribers
const broadcast = (pollId, poll) => {
  const clients = subscribers.get(pollId);
  if (!clients) return;
  const message = JSON.stringify({ type: 'update', poll });
  clients.forEach(ws => {
    if (ws.readyState === 1) ws.send(message);
  });
};

// Generate 6-char random id
const genId = () => Math.random().toString(36).substring(2, 8);

// POST /polls - create poll
app.post('/polls', (req, res) => {
  const { question, options } = req.body;

  if (!question || !options || !Array.isArray(options) || options.length < 2 || options.length > 6) {
    return res.status(400).json({ error: 'Need question and 2-6 options' });
  }

  const id = genId();
  const poll = {
    id,
    question,
    options: options.map(text => ({ text, votes: 0 })),
    createdAt: new Date().toISOString(),
  };

  polls.set(id, poll);
  res.json(poll);
});

// GET /polls/recent - list recent polls
app.get('/polls/recent', (req, res) => {
  const recent = [...polls.values()]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);
  res.json(recent);
});

// GET /polls/:id - get poll
app.get('/polls/:id', (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ error: 'Not found' });
  res.json(poll);
});

// POST /polls/:id/vote - vote on option
app.post('/polls/:id/vote', (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ error: 'Not found' });

  const { option } = req.body;
  if (typeof option !== 'number' || option < 0 || option >= poll.options.length) {
    return res.status(400).json({ error: 'Invalid option' });
  }

  poll.options[option].votes++;
  broadcast(req.params.id, poll);
  res.json(poll);
});

// Create HTTP server and WebSocket server
const server = createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  // Extract poll id from URL: /polls/:id/stream
  const match = req.url.match(/^\/polls\/([a-z0-9]+)\/stream$/);
  if (!match) {
    ws.close(1008, 'Invalid path');
    return;
  }

  const pollId = match[1];
  const poll = polls.get(pollId);
  if (!poll) {
    ws.close(1008, 'Poll not found');
    return;
  }

  // Add to subscribers
  if (!subscribers.has(pollId)) {
    subscribers.set(pollId, new Set());
  }
  subscribers.get(pollId).add(ws);

  // Send current state on connect
  ws.send(JSON.stringify({ type: 'init', poll }));

  // Remove on disconnect
  ws.on('close', () => {
    const clients = subscribers.get(pollId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) subscribers.delete(pollId);
    }
  });
});

server.listen(4010, () => {
  console.log('Poll API ready at http://localhost:4010');
  console.log('WebSocket streams at ws://localhost:4010/polls/:id/stream');
});
