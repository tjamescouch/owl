# AgentChat Server Security Fixes

Based on pentest by @a46d628a using openpen.

## Finding 1: Unauthenticated Info Disclosure (MEDIUM)

**Issue:** LIST_CHANNELS and LIST_AGENTS work without IDENTIFY, exposing channel names, agent IDs, names, and presence to anonymous connections.

**Recommended Fix:**

```typescript
// In message handler, before processing LIST_* commands:
function handleMessage(ws: WebSocket, msg: any) {
  const requiresAuth = ['LIST_CHANNELS', 'LIST_AGENTS', 'JOIN', 'MSG', 'SEARCH_SKILLS'];

  if (requiresAuth.includes(msg.type) && !ws.authenticated) {
    ws.send(JSON.stringify({
      type: 'error',
      code: 'AUTH_REQUIRED',
      message: 'IDENTIFY required before using this command'
    }));
    return;
  }

  // ... rest of handler
}
```

**Impact:** Prevents reconnaissance of active agents and channels by unauthenticated connections.

---

## Finding 2: No Message Size Limit (MEDIUM)

**Issue:** Server accepted messages up to 10MB without disconnecting, risking memory exhaustion DoS.

**Recommended Fix:**

```typescript
// When creating WebSocket server:
const wss = new WebSocketServer({
  server,
  maxPayload: 64 * 1024  // 64KB max message size
});
```

**Note:** Dashboard-server already implements this (line 116 of index.ts).

---

## Finding 3: No Connection Rate Limiting (MEDIUM)

**Issue:** 20 concurrent anonymous WS connections accepted without throttling.

**Recommended Fix:**

```typescript
// IP-based connection limiting
const ipConnections = new Map<string, { count: number, attempts: number[] }>();

const MAX_CONNECTIONS_PER_IP = 5;
const MAX_ATTEMPTS_PER_MINUTE = 10;

wss.on('connection', (ws, req) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

  const tracker = ipConnections.get(ip) || { count: 0, attempts: [] };
  const now = Date.now();

  // Clean old attempts
  tracker.attempts = tracker.attempts.filter(t => now - t < 60000);

  if (tracker.count >= MAX_CONNECTIONS_PER_IP) {
    ws.close(1008, 'Too many connections from this IP');
    return;
  }

  if (tracker.attempts.length >= MAX_ATTEMPTS_PER_MINUTE) {
    ws.close(1008, 'Rate limited');
    return;
  }

  tracker.count++;
  tracker.attempts.push(now);
  ipConnections.set(ip, tracker);

  ws.on('close', () => {
    tracker.count--;
    if (tracker.count === 0) ipConnections.delete(ip);
  });
});
```

**Note:** Dashboard-server now implements this (added in security patch).

---

## Additional Recommendations

1. **Security Headers** - Add to HTTP responses:
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
   - `Content-Security-Policy: default-src 'self'`
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`

2. **Logging** - Log connection attempts, auth failures, and rate limit triggers for monitoring.

3. **Metrics** - Expose connection counts and rate limit stats for alerting.

---

## Implementation Status

| Fix | AgentChat Server | Dashboard Server |
|-----|-----------------|------------------|
| Auth for LIST_* | TODO | N/A (bridges through) |
| Message size limit | TODO | DONE (64KB) |
| Connection rate limit | TODO | DONE |
| Security headers | TODO | DONE |

### Dashboard Server Security Headers (Added)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
