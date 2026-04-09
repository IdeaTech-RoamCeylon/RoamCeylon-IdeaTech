# Real-Time Recommendation Updates

## Overview

The system now provides real-time recommendation updates that automatically refresh when:
- ✅ User clicks a recommendation
- ✅ User provides feedback (1-5 stars) 
- ✅ User changes their preferences

**Two implementation options:**
1. **WebSocket (Preferred)** — Real-time push updates with Socket.io
2. **Polling (Fallback)** — Periodic checks for updates (5-10 second intervals)

---

## Architecture

### Real-Time Update Flow

```
User Action (click/feedback/preference)
        ↓
API Endpoint (POST /api/recommendations/*)
        ↓
Event Emitted (via EventEmitter2)
        ↓
RecommendationUpdateService (@OnEvent listener)
        ↓
RecommendationGateway (broadcast to WebSocket clients)
        ↓
Frontend Client (receives fresh recommendations in real-time)
```

### Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **RecommendationGateway** | WebSocket handler, client management | `src/gateways/recommendation.gateway.ts` |
| **RecommendationUpdateService** | Event listeners (click/feedback/preference) | `src/modules/ml/services/recommendationUpdate.service.ts` |
| **RecommendationUpdateController** | REST endpoints to trigger updates | `src/modules/ml/controllers/recommendationUpdate.controller.ts` |

---

## Implementation: WebSocket (Recommended)

### Backend Setup ✅
Already configured with Socket.io v4.8.1:
- Namespace: `/recommendations`
- Transports: WebSocket + Polling fallback
- CORS: Enabled for cross-origin clients

### Frontend Client Code

#### 1. Connect to WebSocket and Subscribe

```typescript
import io from 'socket.io-client';

// Connect to recommendations namespace
const socket = io('http://localhost:3001', {
  namespace: '/recommendations',
  query: {
    userId: 'user123',
    preferences: JSON.stringify({
      culturalInterest: 8,
      adventureLevel: 7,
      relaxationFocus: 5
    })
  },
  transports: ['websocket', 'polling'], // Fallback to polling if needed
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: Infinity,
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to recommendations gateway');
});

socket.on('disconnect', () => {
  console.log('📴 Disconnected from recommendations');
});

socket.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});
```

#### 2. Listen for Recommendation Updates

```typescript
// Receive fresh recommendations when events occur
socket.on('recommendations:update', (data) => {
  console.log('📤 New recommendations received:', {
    count: data.count,
    timestamp: data.timestamp,
  });
  
  // Update UI with fresh recommendations
  updateRecommendationsUI(data.recommendations);
});

// Get notified about interactions
socket.on('interaction', (data) => {
  console.log(`🖱️  ${data.message}`);
  // Optional: show toast/toast notification
});

// Get notified about feedback processing
socket.on('feedback_processed', (data) => {
  console.log(`⭐ Feedback impact: ${data.message}`);
});

// Get notified about preference updates
socket.on('preferences_applied', (data) => {
  console.log(`⚙️  Preferences updated: ${JSON.stringify(data.preferences)}`);
});
```

#### 3. Trigger Updates on User Actions

```typescript
// When user clicks a recommendation
async function handleRecommendationClick(recommendation: any) {
  try {
    const response = await fetch(
      'http://localhost:3001/api/recommendations/click',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user123',
          recommendationId: recommendation.id,
          itemId: recommendation.itemId,
          mlScore: recommendation.mlScore,
        }),
      }
    );

    const result = await response.json();
    console.log('✅ Click recorded:', result.message);
    // Don't need to manually refresh - WebSocket will send updated recs
  } catch (error) {
    console.error('❌ Error recording click:', error);
  }
}

// When user submits feedback
async function handleFeedbackSubmit(rating: number, comment?: string) {
  try {
    const response = await fetch(
      'http://localhost:3001/api/recommendations/feedback',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user123',
          feedbackValue: rating,
          comment: comment,
        }),
      }
    );

    const result = await response.json();
    console.log('✅ Feedback recorded:', result.message);
    // WebSocket will automatically send updated recommendations
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
  }
}

// When user changes preferences
async function handlePreferencesChange(preferences: any) {
  try {
    const response = await fetch(
      'http://localhost:3001/api/recommendations/preferences',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user123',
          preferences: preferences,
        }),
      }
    );

    const result = await response.json();
    console.log('✅ Preferences updated:', result.preferences);
    // WebSocket will send new recommendations based on updated preferences
  } catch (error) {
    console.error('❌ Error updating preferences:', error);
  }
}

// When user does implicit action (save, bookmark, etc)
async function recordUserBehavior(eventType: string, itemId: string) {
  try {
    const response = await fetch(
      'http://localhost:3001/api/recommendations/behavior',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user123',
          eventType: eventType, // 'trip_saved', 'trip_bookmarked', etc
          itemId: itemId,
        }),
      }
    );

    const result = await response.json();
    console.log('✅ Behavior recorded:', result.message);
  } catch (error) {
    console.error('❌ Error recording behavior:', error);
  }
}
```

---

## Implementation: Polling (Fallback for No WebSocket)

### Polling Flow

For clients that don't support persistent WebSocket connections:

```typescript
// Poll for updates every 5-10 seconds
let lastCheckTime = new Date();

const pollInterval = setInterval(async () => {
  try {
    const response = await fetch(
      `http://localhost:3001/api/recommendations/updates/user123?lastCheck=${lastCheckTime.toISOString()}`
    );

    const data = await response.json();

    if (data.hasUpdates) {
      console.log(`📊 Updates available: ${data.reason}`);
      
      // Fetch fresh recommendations manually
      const recsResponse = await fetch(
        'http://localhost:3001/api/recommendations/personalized'
      );
      const recommendations = await recsResponse.json();
      
      // Update UI
      updateRecommendationsUI(recommendations);
      
      // Update last check time
      lastCheckTime = new Date(data.lastUpdate);
    }
  } catch (error) {
    console.error('❌ Polling error:', error);
  }
}, 5000); // Check every 5 seconds

// Clean up
window.addEventListener('beforeunload', () => {
  clearInterval(pollInterval);
});
```

---

## API Endpoints Reference

### 1. Record Recommendation Click
```
POST /api/recommendations/click

Request Body:
{
  "userId": "user123",
  "recommendationId": "rec_456",
  "itemId": "destination_789",
  "mlScore": 0.87
}

Response:
{
  "success": true,
  "message": "Click recorded. Updating recommendations...",
  "timestamp": "2026-04-09T14:23:45Z"
}
```

### 2. Record Feedback
```
POST /api/recommendations/feedback

Request Body:
{
  "userId": "user123",
  "feedbackValue": 4,
  "comment": "Great recommendation!"
}

Response:
{
  "success": true,
  "message": "Feedback recorded. Recommendations updated.",
  "timestamp": "2026-04-09T14:23:45Z"
}
```

### 3. Update Preferences
```
POST /api/recommendations/preferences

Request Body:
{
  "userId": "user123",
  "preferences": {
    "culturalInterest": 8,
    "adventureLevel": 7,
    "relaxationFocus": 5,
    "budget": "mid-range",
    "travelPace": "slow"
  }
}

Response:
{
  "success": true,
  "message": "Preferences updated. Recommendations refreshed.",
  "preferences": { ... },
  "timestamp": "2026-04-09T14:23:45Z"
}
```

### 4. Check for Updates (Polling)
```
GET /api/recommendations/updates/user123?lastCheck=2026-04-09T14:23:00Z

Response:
{
  "success": true,
  "hasUpdates": true,
  "lastUpdate": "2026-04-09T14:23:15Z",
  "reason": "click",
  "lastCheckTime": "2026-04-09T14:23:00Z"
}
```

### 5. Gateway Status (Admin)
```
GET /api/recommendations/gateway/status

Response:
{
  "connectedClients": 42,
  "connectedUsers": ["user123", "user456", ...],
  "gatewayStatus": "active",
  "timestamp": "2026-04-09T14:23:45Z"
}
```

---

## WebSocket Events Reference

### Events Sent to Client

| Event | Payload | When |
|-------|---------|------|
| `recommendations:update` | `{ recommendations[], count, timestamp }` | After click/feedback/preference change |
| `interaction` | `{ type, itemId, message, timestamp }` | When user interacts |
| `feedback_processed` | `{ feedbackValue, message, timestamp }` | After feedback submitted |
| `preferences_applied` | `{ preferences, message, timestamp }` | After preferences changed |
| `error` | `{ message, error }` | On error |

### Messages Sent from Client

| Message | Payload | Purpose |
|---------|---------|---------|
| `subscribe` | `{ userId, preferences? }` | Subscribe to user's updates |

---

## React Integration Example

```typescript
import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

export function RecommendationsWidget({ userId }: { userId: string }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Connect to WebSocket
    socketRef.current = io('http://localhost:3001', {
      namespace: '/recommendations',
      query: { userId },
      transports: ['websocket', 'polling'],
    });

    // Listen for updates
    socketRef.current.on('recommendations:update', (data) => {
      setRecommendations(data.recommendations);
      setLoading(false);
    });

    socketRef.current.on('error', (error) => {
      console.error('Error:', error);
      setLoading(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId]);

  const handleClick = async (rec: any) => {
    await fetch('http://localhost:3001/api/recommendations/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        recommendationId: rec.id,
        itemId: rec.itemId,
        mlScore: rec.mlScore,
      }),
    });
    // WebSocket will automatically update recommendations
  };

  return (
    <div>
      <h2>Personalized Recommendations</h2>
      {loading && <p>Loading...</p>}
      <div className="recommendations-grid">
        {recommendations.map((rec) => (
          <div key={rec.id} className="rec-card" onClick={() => handleClick(rec)}>
            <h3>{rec.name}</h3>
            <p>Score: {(rec.mlScore * 100).toFixed(0)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## How It Works - Event Flow

### Example: User Clicks Recommendation

```
1. Frontend: User clicks "View" button
   ↓
2. Frontend: POST /api/recommendations/click
   ↓
3. Backend: RecommendationUpdateController.recordRecommendationClick()
   ↓
4. Backend: eventEmitter.emit('recommendation.clicked', ...)
   ↓
5. Backend: RecommendationUpdateService.onRecommendationClicked() listener fires
   ↓
6. Backend: recommendationGateway.broadcastUserUpdate(userId, 'click')
   ↓
7. Backend: Fetches fresh recommendations via mlService.getPersonalizedRecommendations()
   ↓
8. Backend: Sends via socket.emit('recommendations:update', newRecs)
   ↓
9. Frontend: Receives recommendations:update event
   ↓
10. Frontend: UI updates with new recommendations automatically
```

### Example: User Submits Feedback

Same flow as click, but with more processing:
- FeedbackService validates and stores rating
- FeedbackMappingService updates UserCategoryWeight
- Real-time update broadcasts new recommendations

---

## Configuration

### Environment Variables

```bash
# .env
SOCKET_IO_ENABLED=true
SOCKET_IO_NAMESPACE=/recommendations
SOCKET_IO_CORS_ORIGIN=http://localhost:3000,https://example.com
POLLING_INTERVAL_MS=5000
RECOMMENDATION_CACHE_TTL_MS=3600000
```

### Scalability Notes

**Current Setup:**
- Single instance (no Redis adapter)
- Good for development and single-server deployments
- Supports ~1000 concurrent connections per server

**Production Scaling:**
If multiple backend instances needed:
1. Add Redis adapter to Socket.io
2. Install: `npm install socket.io-redis`
3. Configure in app.module.ts:
   ```typescript
   @WebSocketGateway({
     adapter: createAdapter(),
   })
   ```

---

## Monitoring & Debugging

### Gateway Status Endpoint
```bash
curl http://localhost:3001/api/recommendations/gateway/status

{
  "connectedClients": 24,
  "connectedUsers": ["user123", "user456", ...],
  "gatewayStatus": "active",
  "timestamp": "2026-04-09T14:23:45Z"
}
```

### WebSocket Inspector
Use browser DevTools → Network → WS to inspect WebSocket connections

### Logs
```bash
npm run start:dev 2>&1 | grep -i "recommendation\|gateway\|websocket"
```

---

## Testing

### Manual Testing
```bash
# Test click endpoint
curl -X POST http://localhost:3001/api/recommendations/click \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "recommendationId": "rec_456",
    "itemId": "dest_789",
    "mlScore": 0.87
  }'

# Test feedback endpoint
curl -X POST http://localhost:3001/api/recommendations/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "feedbackValue": 5,
    "comment": "Excellent!"
  }'

# Check gateway status
curl http://localhost:3001/api/recommendations/gateway/status
```

### E2E Test (WebSocket simulation)
```typescript
// Use socket.io-client-next for testing
import { io } from 'socket.io-client';

async function testWebSocket() {
  const socket = io('http://localhost:3001', {
    namespace: '/recommendations',
    query: { userId: 'test_user' },
  });

  socket.on('recommendations:update', (data) => {
    console.log('✅ Received update:', data.count, 'recommendations');
  });

  // Trigger updates
  await fetch('http://localhost:3001/api/recommendations/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'test_user',
      recommendationId: 'rec_1',
      itemId: 'item_1',
      mlScore: 0.9,
    }),
  });
}
```

---

## Key Features

✅ **Real-Time Updates** — No manual refresh needed  
✅ **Event-Driven** — Updates on click, feedback, or preference change  
✅ **WebSocket + Polling** — Works everywhere (modern/legacy browsers)  
✅ **Automatic Reconnection** — Handles network interruptions  
✅ **Scalable** — Gateway status monitoring & ready for Redis scaling  
✅ **Typed Events** — Full TypeScript support  
✅ **Zero Breaking Changes** — Existing endpoints still work  

---

## Troubleshooting

**Problem:** WebSocket disconnects frequently
- **Solution:** Check server logs for errors, ensure network is stable, increase reconnectionDelay

**Problem:** Recommendations not updating
- **Solution:** Verify events are being emitted, check Redis adapter if using multiple instances

**Problem:** High latency on updates
- **Solution:** Use WebSocket over polling, reduce cache TTL, optimize database queries

**Problem:** Too many connected clients
- **Solution:** Implement client connection limits, use Redis adapter for multi-instance setup

---

## Next Steps

- Add real-time analytics dashboard
- Implement user presence tracking
- Scale to multi-instance with Redis
- Add recommendation confidence scores
- Implement A/B testing with variants
