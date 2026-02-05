import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage
const polls = new Map();

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
  res.json(poll);
});

app.listen(4010, () => {
  console.log('Poll API ready at http://localhost:4010');
});
