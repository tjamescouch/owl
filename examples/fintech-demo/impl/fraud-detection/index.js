const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

app.use(bodyParser.json());

// Mock anomaly threshold
const THRESHOLD = 0.7;

// Simple risk score (mock ML)
function calculateRisk(tx) {
  let risk = 0;
  if (tx.amount > 1000) risk += 0.4;
  if (tx.location !== 'US') risk += 0.3; // Mock geo
  if (tx.device === 'new') risk += 0.3;
  return Math.min(1, risk);
}

app.post('/transaction', (req, res) => {
  const tx = req.body;
  const risk = calculateRisk(tx);
  const alert = risk > THRESHOLD;
  
  if (alert) {
    console.log('ALERT: High risk transaction', tx);
  }
  
  res.json({ risk, alert, message: alert ? 'Review required' : 'Approved' });
});

app.get('/alerts', (req, res) => {
  // Mock alerts
  res.json([{ id: 1, txId: '123', risk: 0.8, status: 'pending' }]);
});

app.listen(PORT, () => {
  console.log(`Fraud Detection running on port ${PORT}`);
});