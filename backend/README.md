# Spinwheel Backend

Go-based API service for the Dynamic Spinwheel application.

## Features

- RESTful API endpoints
- Claude API integration for intelligent option generation
- Input detection (comma-separated lists vs natural language prompts)
- In-memory state persistence
- CORS enabled for frontend integration

## API Endpoints

### `POST /api/generate-options`
Generate new wheel options from a prompt or list.

**Request:**
```json
{
  "prompt": "desserts"
}
```

**Response:**
```json
{
  "options": ["Chocolate Cake", "Ice Cream", "Tiramisu", ...]
}
```

### `GET /api/current-options`
Get currently stored wheel options.

**Response:**
```json
{
  "options": ["Option 1", "Option 2", ...]
}
```

### `GET /api/health`
Health check endpoint.

**Response:** `200 OK`

## Development

### Run locally

```bash
export CLAUDE_API_KEY=your_key
go run main.go
```

Server starts on port 8080.

### Build Docker image

```bash
docker build -t spinwheel-backend:latest .
```

### Deploy to Kubernetes

```bash
helm install spinwheel-backend ../helm/spinwheel-backend \
  --set claude.apiKey=$CLAUDE_API_KEY
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLAUDE_API_KEY` | Yes | Anthropic Claude API key |
| `PORT` | No | Server port (default: 8080) |

## Architecture

- Pure Go, no external dependencies for HTTP server
- Stateful (in-memory) - options persist across requests within pod lifecycle
- Horizontal scaling possible, but each pod maintains separate state
- For shared state across pods, consider adding Redis or similar

## Input Detection Logic

The backend automatically detects input type:

1. **Comma-separated list**: Contains commas, items < 50 chars, no periods
   - Example: `"Pizza, Tacos, Burgers"`
   - Action: Parse directly, no API call

2. **Natural language prompt**: Otherwise
   - Example: `"popular desserts"`
   - Action: Call Claude API to generate options

## Testing

```bash
# Test health endpoint
curl http://localhost:8080/api/health

# Test with comma-separated list
curl -X POST http://localhost:8080/api/generate-options \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Red, Blue, Green, Yellow"}'

# Test with natural language prompt
curl -X POST http://localhost:8080/api/generate-options \
  -H "Content-Type: application/json" \
  -d '{"prompt": "programming languages"}'

# Get current options
curl http://localhost:8080/api/current-options
```
