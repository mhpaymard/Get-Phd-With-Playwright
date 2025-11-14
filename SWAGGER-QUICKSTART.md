# 🚀 Quick Start: Using FindAPhD API with Swagger

## 30-Second Start

```bash
# Start the server
node src/api/server.js

# Open browser
http://91.99.13.17/api-docs
```

Done! You now have interactive API documentation.

---

## Your First API Call (60 seconds)

### Step 1: Open Swagger UI
Go to: `http://91.99.13.17/api-docs`

### Step 2: Create a Session
1. Find `POST /session` under **Session** section
2. Click **"Try it out"**
3. Edit Request Body:
```json
{
  "userId": "my-first-user"
}
```
4. Click **"Execute"**
5. **Copy the `sessionId`** from response

### Step 3: Perform Search
1. Find `POST /search` under **Search** section
2. Click **"Try it out"**
3. Select example **"withFilters"** or paste:
```json
{
  "userId": "my-first-user",
  "sessionId": "PASTE_YOUR_SESSION_ID_HERE",
  "keywords": "artificial intelligence",
  "filters": {
    "discipline": "10M7g0",
    "geography": ["g0w900"]
  },
  "page": 1
}
```
4. Click **"Execute"**
5. **See PhD positions in response!**

---

## Common Use Cases

### 1. Simple Search (No filters)
```json
POST /search
{
  "userId": "user-123",
  "keywords": "machine learning"
}
```

### 2. UK Computer Science PhDs
```json
POST /search
{
  "userId": "user-123",
  "keywords": "deep learning",
  "filters": {
    "discipline": "10M7g0",
    "geography": ["g0w900"]
  }
}
```

### 3. Funded Positions Only
```json
POST /search
{
  "userId": "user-123",
  "keywords": "quantum computing",
  "filters": {
    "funding": ["01M0", "0100"]
  }
}
```

### 4. Get Next Page
```json
POST /search/{searchId}/continue
{
  "sessionId": "your-session-id",
  "page": 2
}
```

---

## Filter Codes Reference

### Disciplines (Top 5)
- `10M7g0` - Computer Science
- `10M7g1` - Engineering
- `10M7g2` - Medicine & Health
- `10M7g3` - Business & Management
- `10M7g4` - Psychology

### Geography (Top 5)
- `g0w900` - United Kingdom
- `g0Mw00` - United States
- `g0w800` - Australia
- `g0w700` - Canada
- `g0w600` - Germany

### Funding
- `01M0` - Self-funded
- `0100` - Funded PhD Project
- `0110` - Studentship

**Full list available at:** `POST /search/filters/available`

---

## JavaScript Quick Example

```javascript
// Create session and search
async function quickSearch(keywords) {
  // 1. Create session
  const sessionResp = await fetch('http://91.99.13.17/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'quick-user' })
  });
  const { data: { sessionId } } = await sessionResp.json();

  // 2. Search
  const searchResp = await fetch('http://91.99.13.17/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'quick-user',
      sessionId,
      keywords,
      filters: { discipline: '10M7g0', geography: ['g0w900'] }
    })
  });
  
  return await searchResp.json();
}

// Usage
quickSearch('artificial intelligence').then(result => {
  console.log(`Found ${result.data.results.length} PhD positions`);
  result.data.results.forEach(phd => {
    console.log(`- ${phd.title} at ${phd.institution}`);
  });
});
```

---

## Python Quick Example

```python
import requests

def quick_search(keywords):
    BASE = 'http://91.99.13.17/api'
    
    # 1. Create session
    session = requests.post(f'{BASE}/session', 
                          json={'userId': 'quick-user'}).json()
    session_id = session['data']['sessionId']
    
    # 2. Search
    result = requests.post(f'{BASE}/search', json={
        'userId': 'quick-user',
        'sessionId': session_id,
        'keywords': keywords,
        'filters': {
            'discipline': '10M7g0',
            'geography': ['g0w900']
        }
    }).json()
    
    return result

# Usage
result = quick_search('machine learning')
print(f"Found {len(result['data']['results'])} PhD positions")
for phd in result['data']['results']:
    print(f"- {phd['title']} at {phd['institution']}")
```

---

## cURL Quick Commands

```bash
# 1. Health check
curl http://91.99.13.17/api/health

# 2. Create session
curl -X POST http://91.99.13.17/api/session \
  -H "Content-Type: application/json" \
  -d '{"userId":"curl-user"}'

# 3. Search (replace SESSION_ID)
curl -X POST http://91.99.13.17/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "curl-user",
    "sessionId": "SESSION_ID",
    "keywords": "artificial intelligence",
    "filters": {"discipline": "10M7g0"}
  }'
```

---

## Tips

### 1. Always Check Health First
```bash
curl http://91.99.13.17/api/health/ready
```
If `ready: false`, wait a bit before searching.

### 2. Reuse Sessions
Keep the same `sessionId` for multiple searches to maintain history.

### 3. Cache is Your Friend
Identical searches within 15 minutes use cached results (faster!).

### 4. Pagination
Results come in pages. Use `POST /search/{searchId}/continue` for more.

### 5. View in Swagger
Always test new queries in Swagger UI first - it's interactive!

---

## Next Steps

1. **Read Full Guide**: `docs/SWAGGER-GUIDE.md` for detailed examples
2. **API Reference**: `docs/API-DOCUMENTATION.md` for all endpoints
3. **Generate Client**: Use OpenAPI Generator for your language
4. **Deployment**: `docs/DEPLOYMENT.md` for production setup

---

**Need Help?**
- Check `/api/health` for service status
- All examples work in Swagger UI at `/api-docs`
- Full OpenAPI spec in `swagger.json`

Happy searching! 🎓
