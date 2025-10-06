# Dynamic Spinwheel

A dynamic spinwheel application that generates wheel options from natural language prompts or comma-separated lists using the Claude API.

## Features

- **Dynamic Option Generation**: Generate wheel options via:
  - Natural language prompts (e.g., "MLB teams", "desserts", "programming languages")
  - Comma-separated lists (e.g., "Pizza, Tacos, Burgers, Sushi")
  - Real-time web search for current information (e.g., "restaurants at The Grove", "today's Dodgers roster")
- **Truly Random Selection**: Picks a random winner first, then spins to that location for fair results
- **Web Search Integration**: Automatically searches the web for real-time, location-specific, or current data
- **Persistent State**: Generated wheels remain active until you create a new one
- **Claude API Integration**: Uses Claude Sonnet 4.5 with web search tool for intelligent option generation
- **Smooth Animations**: Price-is-right style vertical spin animation with minimum spin distance for visual effect

## Project Structure

```
SpinWheel/
├── backend/                    # Go API service
│   ├── main.go                # API endpoints with Claude web search integration
│   ├── go.mod
│   ├── Dockerfile             # Backend container
│   └── helm/                  # Backend Kubernetes manifests
├── frontend/                   # Static web app
│   ├── index.html
│   ├── script.js              # Truly random spin logic
│   ├── style.css
│   ├── nginx.conf             # Nginx config with /api proxy
│   ├── Dockerfile             # Frontend container
│   └── helm/                  # Frontend Kubernetes manifests
```

## Development Setup

### Prerequisites

- Docker Desktop with Dev Containers support
- VS Code with "Dev Containers" extension
- Claude API key from [Anthropic](https://console.anthropic.com/)

### Running in Dev Container (Recommended)

#### 1. Set up environment variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
# Edit .env and add your CLAUDE_API_KEY
```

#### 2. Open in Dev Container

1. Open project in VS Code
2. Press `F1` → "Dev Containers: Reopen in Container"
3. Wait for container to build and start
4. Press `F5` to run the backend

Backend runs on http://localhost:8080 (port is auto-forwarded).

#### 3. Start the frontend (separate terminal, outside container)

```bash
cd frontend
npm install
npm start
```

Frontend opens at http://localhost:3000 and proxies API requests to backend:8080.

## Production Deployment

### Docker Build & Push

```bash
# Backend
cd backend
docker build -t registry.k8s.blacktoaster.com/spinwheel-backend:v1.0.0 .
docker push registry.k8s.blacktoaster.com/spinwheel-backend:v1.0.0

# Frontend
cd frontend
docker build -t registry.k8s.blacktoaster.com/spinwheel-frontend:v1.0.0 .
docker push registry.k8s.blacktoaster.com/spinwheel-frontend:v1.0.0
```

### Kubernetes Deployment

#### Deploy Backend

```bash
# Option 1: Edit values.yaml and deploy
helm install spinwheel-backend ./helm/spinwheel-backend

# Option 2: Override via command line
helm install spinwheel-backend ./helm/spinwheel-backend \
  --set image.tag=v1.0.0 \
  --set claude.apiKey=$CLAUDE_API_KEY
```

#### Deploy Frontend

```bash
helm install spinwheel-frontend ./helm/spinwheel-frontend \
  --set image.tag=v1.0.0 \
  --set ingress.host=spinwheel.yourdomain.com
```

## API Endpoints

### Backend Service (port 8080)

#### `POST /api/generate-options`
Generate new wheel options from a prompt or comma-separated list.

**Request:**
```json
{
  "prompt": "MLB teams"
}
```

**Response:**
```json
{
  "options": ["Arizona Diamondbacks", "Atlanta Braves", ...]
}
```

**Behavior:**
- **Comma-separated lists**: Parsed directly without API call (e.g., "Pizza, Tacos, Burgers")
- **Natural language prompts**: Sent to Claude API
- **Web search**: Automatically triggered by Claude for real-time/location queries
- **Response cleaning**: Automatically removes explanatory text, returns only the list

#### `GET /api/current-options`
Get the current wheel options (persisted in memory).

**Response:**
```json
{
  "options": ["Option 1", "Option 2", ...]
}
```

#### `GET /api/health`
Health check endpoint.

### Communication Flow
```
User → Ingress → Frontend (Nginx) → Static Files
                    ↓
                 /api/* → Backend Service → Claude API (with web search tool)
                                               ↓
                                           Web Search (when needed)
```

### Spin Algorithm

The wheel uses a truly random selection algorithm:

1. **Random Selection**: When spin button is clicked, a winner is randomly selected using `Math.random()`
2. **Target Calculation**: The exact offset needed to land on the winner is calculated
3. **Visual Effect**: 3000-5000 pixels of spinning distance is added for visual drama
4. **Smooth Animation**: Easing function provides smooth deceleration to the target

This ensures fair, truly random results regardless of visual physics.

### How Web Search Works

The backend automatically enables Claude's web search tool for generating options. Claude intelligently decides when to use web search based on the prompt:

**Web search is used for:**
- Real-time information: "today's Dodgers roster", "NFL teams playing today"
- Location-specific queries: "restaurants at The Grove Los Angeles", "coffee shops in Santa Monica"

**Web search is NOT used for:**
- Static, well-known lists: "MLB teams", "NBA teams", "US states"
- General categories: "desserts", "programming languages", "colors"

## License

MIT
