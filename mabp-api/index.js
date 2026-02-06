const express = require('express');
const cors = require('cors');
const marketplaceRouter = require('./marketplace-aggregator');

const app = express();
app.use(cors());
app.use(express.json());

// Mount marketplace aggregator
app.use('/api/marketplace', marketplaceRouter);

let todos = [];
let nextId = 1;

// GET all todos
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// POST new todo
app.post('/api/todos', (req, res) => {
  const todo = {
    id: nextId++,
    text: req.body.text || '',
    done: false,
    createdAt: new Date().toISOString()
  };
  todos.push(todo);
  res.status(201).json(todo);
});

// PUT update todo
app.put('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find(t => t.id === id);
  if (!todo) return res.status(404).json({ error: 'Not found' });

  if (req.body.text !== undefined) todo.text = req.body.text;
  if (req.body.done !== undefined) todo.done = req.body.done;
  res.json(todo);
});

// DELETE todo
app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });

  todos.splice(index, 1);
  res.status(204).send();
});

app.listen(4000, () => {
  console.log('API running on http://localhost:4000');
});
