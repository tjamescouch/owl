const express = require('express');
const router = express.Router();

// In-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttl = CACHE_TTL) {
  cache.set(key, { data, expires: Date.now() + ttl });
}

// AgentChat MCP client stub - in production, this would call actual MCP tools
// For now, we'll use fetch to call the agentchat server directly or mock
class AgentChatClient {
  constructor(serverUrl = process.env.AGENTCHAT_URL || (process.env.AGENTCHAT_PUBLIC === 'true' ? 'wss://agentchat-server.fly.dev' : 'ws://localhost:6667')) {
    this.serverUrl = serverUrl;
    this.httpUrl = serverUrl.replace('wss://', 'https://').replace('ws://', 'http://');
  }

  async searchSkills(options = {}) {
    const cacheKey = `skills:${JSON.stringify(options)}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // Mock data for now - in production would call MCP tool
    const skills = [
      { agent_id: '@a46d628a', capability: 'code_review', description: 'Code review and analysis', rate: 0, currency: 'TEST' },
      { agent_id: '@514241e7', capability: 'web_development', description: 'React/TypeScript web apps', rate: 0, currency: 'TEST' },
      { agent_id: '@271c84c6', capability: 'api_development', description: 'Express/Node.js APIs', rate: 0, currency: 'TEST' },
      { agent_id: '@f993d16c', capability: 'system_design', description: 'Architecture and system design', rate: 0, currency: 'TEST' },
    ];

    const filtered = options.capability
      ? skills.filter(s => s.capability.includes(options.capability))
      : skills;

    setCache(cacheKey, filtered);
    return filtered;
  }

  async getRating(agentId) {
    const cacheKey = `rating:${agentId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // Mock data - in production would call MCP tool
    const rating = {
      agent_id: agentId,
      elo: 1000 + Math.floor(Math.random() * 500),
      completed: Math.floor(Math.random() * 20),
      disputed: Math.floor(Math.random() * 2),
    };

    setCache(cacheKey, rating);
    return rating;
  }

  async getLeaderboard(limit = 10) {
    const cacheKey = `leaderboard:${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // Mock data - in production would call MCP tool
    const leaderboard = [
      { agent_id: '@a46d628a', elo: 1450, completed: 15, disputed: 0 },
      { agent_id: '@514241e7', elo: 1380, completed: 12, disputed: 1 },
      { agent_id: '@271c84c6', elo: 1320, completed: 10, disputed: 0 },
      { agent_id: '@f993d16c', elo: 1200, completed: 5, disputed: 0 },
    ].slice(0, limit);

    setCache(cacheKey, leaderboard);
    return leaderboard;
  }
}

const client = new AgentChatClient();

// REST endpoints

// GET /marketplace/skills - Search available skills
router.get('/skills', async (req, res) => {
  try {
    const { capability, currency, max_rate, limit } = req.query;
    const skills = await client.searchSkills({ capability, currency, max_rate, limit });
    res.json({ skills, cached: getCached(`skills:${JSON.stringify(req.query)}`) !== null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /marketplace/ratings/:agentId - Get agent rating
router.get('/ratings/:agentId', async (req, res) => {
  try {
    const rating = await client.getRating(req.params.agentId);
    res.json(rating);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /marketplace/leaderboard - Get top-rated agents
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await client.getLeaderboard(limit);
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /marketplace/cache/stats - Cache statistics
router.get('/cache/stats', (req, res) => {
  const stats = {
    entries: cache.size,
    keys: Array.from(cache.keys()),
  };
  res.json(stats);
});

// DELETE /marketplace/cache - Clear cache
router.delete('/cache', (req, res) => {
  cache.clear();
  res.json({ cleared: true });
});

module.exports = router;
module.exports.AgentChatClient = AgentChatClient;
