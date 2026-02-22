const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const SECRET = process.env.JWT_SECRET || 'demo-secret'; // Use env in prod

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

// Mock DB
let balances = { user1: 1000 };
let transactions = [];

// Middleware for auth
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /payments
app.post('/payments', authenticate, (req, res) => {
  const { amount, to } = req.body;
  if (amount <= 0 || !to) return res.status(400).json({ error: 'Invalid amount or to' });
  if (balances[req.user.id] < amount) return res.status(400).json({ error: 'Insufficient funds' });
  
  balances[req.user.id] -= amount;
  balances[to] = (balances[to] || 0) + amount;
  const tx = { id: Date.now(), from: req.user.id, to, amount, timestamp: new Date() };
  transactions.push(tx);
  
  res.json({ success: true, txId: tx.id });
});

// GET /balance/:userId
app.get('/balance/:userId', authenticate, (req, res) => {
  if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  res.json({ balance: balances[req.params.userId] || 0 });
});

app.listen(PORT, () => {
  console.log(`Secure API running on port ${PORT}`);
  console.log('Endpoints: POST /payments, GET /balance/:userId');
  console.log('Auth: Bearer token with {id: "user1"}');
});