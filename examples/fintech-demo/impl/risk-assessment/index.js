const express = require('express');
const jstat = require('jstat');
const fs = require('fs');

const app = express();
app.use(express.json());
const PORT = 3002;

// Mock portfolio data
const portfolio = [1000, -200, 500, 300, -100]; // Returns

// Calculate VaR (95% confidence)
function calculateVaR(returns, confidence = 0.95) {
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * (1 - confidence));
  return sorted[index] || 0;
}

// POST /assess
app.post('/assess', (req, res) => {
  const { returns, confidence = 0.95 } = req.body;
  const varValue = calculateVaR(returns || portfolio, confidence);
  const report = {
    var95: varValue,
    worstCase: Math.min(...(returns || portfolio)),
    avgReturn: jstat.mean(returns || portfolio),
    confidence
  };
  res.json(report);
});

// CLI mode
if (process.argv[2] === 'assess') {
  const report = { var95: calculateVaR(portfolio), ... };
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

app.listen(PORT, () => {
  console.log(`Risk Assessment on port ${PORT}`);
});