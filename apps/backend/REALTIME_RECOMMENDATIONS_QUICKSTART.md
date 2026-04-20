# Real-Time Recommendations - Quick Start Guide

## ⚡ 2-Minute Setup

### Backend (Already Done ✅)

The backend is now ready with:
- ✅ WebSocket gateway at `io('http://localhost:3001', { namespace: '/recommendations' })`
- ✅ Event-driven architecture (click/feedback/preference)
- ✅ Polling fallback for non-WebSocket clients
- ✅ REST endpoints for triggering updates

### Frontend - Copy & Paste to Get Started

#### Option 1: React Hook (Recommended)

```typescript
// hooks/useRealtimeRecommendations.ts
import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

export function useRealtimeRecommendations(userId: string) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Connect
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
      namespace: '/recommendations',
      query: { userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    // Events
    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));
    socketRef.current.on('recommendations:update', (data) => {
      setRecommendations(data.recommendations);
    });

    return () => socketRef.current?.disconnect();
  }, [userId]);

  return { recommendations, isConnected, socket: socketRef.current };
}
```

Usage in component:
```typescript
function MyRecommendations({ userId }: { userId: string }) {
  const { recommendations, isConnected } = useRealtimeRecommendations(userId);

  return (
    <div>
      <h2>
        Recommendations {isConnected ? '🟢' : '🔴'}
      </h2>
      {recommendations.map((rec) => (
        <div key={rec.id}>{rec.name}</div>
      ))}
    </div>
  );
}
```

#### Option 2: Plain JavaScript

```javascript
// Connect
const socket = io('http://localhost:3001', {
  namespace: '/recommendations',
  query: { userId: 'user123' },
  transports: ['websocket', 'polling'],
});

// Listen
socket.on('recommendations:update', (data) => {
  console.log('📤 New recommendations:', data.recommendations);
  updateUI(data.recommendations);
});

// Trigger updates
async function clickRecommendation(rec) {
  await fetch('http://localhost:3001/api/recommendations/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user123',
      recommendationId: rec.id,
      itemId: rec.itemId,
      mlScore: rec.mlScore,
    }),
  });
  // Automatic update via WebSocket!
}
```

---

## 📋 What Happens on Each Event?

### Click
```
User clicks recommendation
  → POST /api/recommendations/click
  → Recommendation marked as clicked
  → Fresh recommendations fetched
  → WebSocket sends new list automatically
```

### Feedback
```
User rates (1-5 stars)
  → POST /api/recommendations/feedback
  → Rating stored + user profile updated
  → New recommendations computed
  → WebSocket sends updated list
```

### Preference Change
```
User changes preferences
  → POST /api/recommendations/preferences
  → User preferences updated
  → Entire ranking recomputed
  → WebSocket sends new personalized list
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/recommendations/click` | Record click → triggers update |
| `POST` | `/api/recommendations/feedback` | Record rating → triggers update |
| `POST` | `/api/recommendations/preferences` | Change prefs → triggers update |
| `POST` | `/api/recommendations/behavior` | Record implicit action |
| `GET` | `/api/recommendations/updates/:userId` | Poll for updates (fallback) |
| `GET` | `/api/recommendations/gateway/status` | Admin: see connected clients |

---

## 🚀 Testing

### 1. Start Backend
```bash
npm run start:dev --workspace=apps/backend
# Should see: "🚀 Real-time recommendation updates initialized"
```

### 2. Open Browser DevTools

**Chrome:** DevTools → Network → WS (filter) → You'll see the WebSocket connection

**Test connection:**
```javascript
// Paste in browser console
const socket = io('http://localhost:3001', {
  namespace: '/recommendations',
  query: { userId: 'test_user' },
});
socket.on('connect', () => console.log('✅ Connected!'));
socket.on('recommendations:update', (d) => console.log('📤 Got update:', d));
```

### 3. Trigger an Update
```bash
curl -X POST http://localhost:3001/api/recommendations/click \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user","recommendationId":"rec1","itemId":"item1","mlScore":0.9}'
```

Should see in console: `📤 Got update: { recommendations: [...], count: 10, ... }`

---

## 🎯 Key Features

| Feature | Implemented | Usage |
|---------|-------------|-------|
| **Real-time push updates** | ✅ | WebSocket via Socket.io |
| **Polling fallback** | ✅ | For older browsers/networks |
| **Auto-reconnect** | ✅ | Handles disconnections automatically |
| **Multiple clients per user** | ✅ | All tabs get same updates |
| **Event-driven** | ✅ | Click → Fetch → Broadcast |
| **Type-safe events** | ✅ | Full TypeScript support |
| **Admin monitoring** | ✅ | See active connections |

---

## 🔧 Configuration

### Environment Variables

```bash
# .env
SOCKET_IO_ENABLED=true
SOCKET_IO_NAMESPACE=/recommendations
SOCKET_IO_CORS_ORIGIN=http://localhost:3000
```

### Frontend Config

```typescript
io(API_URL, {
  namespace: '/recommendations',
  transports: ['websocket', 'polling'], // Try WS first, fallback to polling
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
});
```

---

## 📊 How to Monitor

```bash
# See active connections
curl http://localhost:3001/api/recommendations/gateway/status

# Expected output:
{
  "connectedClients": 5,
  "connectedUsers": ["user1", "user2"],
  "gatewayStatus": "active",
  "timestamp": "2026-04-09T14:23:45Z"
}
```

---

## 🐛 Troubleshooting

**Q: WebSocket connection fails**
```
A: Check CORS in .env, verify namespace is '/recommendations'
```

**Q: Not receiving updates**
```
A: Ensure you're listening to 'recommendations:update' event
   socket.on('recommendations:update', data => { ... })
```

**Q: Connection drops frequently**
```
A: This is normal! Auto-reconnect kicks in after 1 second.
   Check server logs: npm run start:dev | grep -i error
```

**Q: Using old API methods still work?**
```
A: Yes! GET /api/recommendations/personalized still works.
   WebSocket just makes it real-time.
```

---

## 📁 Files Created

```
backend/
├── src/
│   ├── gateways/
│   │   └── recommendation.gateway.ts              (WebSocket handler)
│   └── modules/ml/
│       ├── services/
│       │   └── recommendationUpdate.service.ts    (Event listeners)
│       └── controllers/
│           └── recommendationUpdate.controller.ts (REST endpoints)
├── ml.module.ts                                   (Updated)
└── REALTIME_RECOMMENDATIONS.md                   (Full docs)
```

---

## ✅ Verification Checklist

- [ ] Backend compiled without errors
- [ ] WebSocket gateway initialized on startup
- [ ] Tested connection in browser console
- [ ] Triggered click event → received update
- [ ] Triggered feedback → received update
- [ ] Checked admin status endpoint
- [ ] Frontend receives fresh recommendations automatically

---

## 🎉 You're Ready!

The real-time recommendation system is now live. Your app will:
1. Push fresh recommendations immediately on click/feedback/preference
2. Fall back to polling if WebSocket fails (never breaks)
3. Auto-reconnect on network interruptions
4. Support multiple concurrent clients per user

**No more manual refresh needed!** ⚡

---

## Next Steps

1. Integrate into your frontend components
2. Update UI to show loading state during updates
3. Add toast notifications for feedback
4. Monitor gateway status in production
5. A/B test impact on user engagement

See [REALTIME_RECOMMENDATIONS.md](./REALTIME_RECOMMENDATIONS.md) for complete API reference and advanced usage.
