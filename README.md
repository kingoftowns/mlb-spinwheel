# Dynamic Spinwheel

A dynamic spinwheel application that generates wheel options from natural language prompts or comma-separated lists using the Claude API.

## Features

- **Dynamic Option Generation**: Generate wheel options via:
  - Natural language prompts (e.g., "MLB teams", "desserts", "programming languages")
  - Comma-separated lists (e.g., "Pizza, Tacos, Burgers, Sushi")
- **Persistent State**: Generated wheels remain active until you create a new one
- **Claude API Integration**: Uses Claude Sonnet 4.5 for intelligent option generation
- **Smooth Animations**: Price-is-right style vertical spin animation
- **Responsive Design**: Works on desktop and mobile devices
- **Microservices Architecture**: Separate frontend and backend services that can be deployed independently

## Project Structure

```
SpinWheel/
├── backend/                    # Go API service
│   ├── main.go                # API endpoints
│   ├── go.mod
│   └── Dockerfile             # Backend container
├── frontend/                   # Static web app
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   ├── nginx.conf             # Nginx config with /api proxy
│   └── Dockerfile             # Frontend container
└── helm/
    ├── spinwheel-backend/     # Backend Kubernetes manifests
    └── spinwheel-frontend/    # Frontend Kubernetes manifests
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

### Running Locally (Without Dev Container)

#### 1. Set up environment variables

```bash
export CLAUDE_API_KEY=your_api_key_here
```

#### 2. Start the backend

```bash
cd backend
go run main.go
```

#### 3. Start the frontend (in a separate terminal)

```bash
cd frontend
npm install
npm start
```

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

#### Deploy Both Together

```bash
# Deploy backend first
helm upgrade --install spinwheel-backend ./helm/spinwheel-backend \
  --set claude.apiKey=$CLAUDE_API_KEY \
  --set image.tag=v1.0.0

# Then deploy frontend
helm upgrade --install spinwheel-frontend ./helm/spinwheel-frontend \
  --set image.tag=v1.0.0
```

### Verify Deployment

```bash
# Check pods
kubectl get pods -n spinwheel

# Check services
kubectl get svc -n spinwheel

# Check backend logs
kubectl logs -n spinwheel -l app.kubernetes.io/name=spinwheel-backend

# Check frontend logs
kubectl logs -n spinwheel -l app.kubernetes.io/name=spinwheel-frontend

# Test backend health
kubectl port-forward -n spinwheel svc/spinwheel-backend 8080:8080
curl http://localhost:8080/api/health
```

## API Endpoints

### Backend Service (port 8080)

#### `POST /api/generate-options`
Generate new wheel options.

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

## Architecture

### Frontend (Nginx + Static Files)
- Serves static HTML/CSS/JS
- Nginx proxies `/api/*` requests to backend service
- Exposed via Ingress with TLS

### Backend (Go API)
- RESTful API endpoints
- Claude API integration
- In-memory state persistence
- Internal ClusterIP service

### Communication Flow
```
User → Ingress → Frontend (Nginx)
                    ↓
                 /api/* → Backend Service → Claude API
```

## Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `CLAUDE_API_KEY` | Anthropic Claude API key | (required) |

### Frontend Nginx Configuration

The frontend nginx.conf proxies API requests to the backend service:

```nginx
location /api/ {
    proxy_pass http://spinwheel-backend:8080;
    ...
}
```

## Troubleshooting

### Backend won't start
```bash
cd backend
go run main.go
# Check logs for errors
```

### Frontend can't reach backend in Kubernetes
```bash
# Verify backend service exists
kubectl get svc -n spinwheel spinwheel-backend

# Check nginx logs
kubectl logs -n spinwheel -l app.kubernetes.io/name=spinwheel-frontend

# Verify service DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  nslookup spinwheel-backend.spinwheel.svc.cluster.local
```

### Claude API errors
- Verify API key in secret: `kubectl get secret -n spinwheel spinwheel-backend-claude -o yaml`
- Check backend logs: `kubectl logs -n spinwheel -l app.kubernetes.io/name=spinwheel-backend`
- Verify API credits at https://console.anthropic.com/

## Independent Deployment Benefits

- **Scale independently**: Scale frontend replicas separately from backend
- **Deploy separately**: Update frontend UI without touching backend API
- **Different lifecycles**: Frontend can be static CDN, backend can be serverless
- **Technology flexibility**: Replace either component without affecting the other

## Example: Scaling

```bash
# Scale backend for more API capacity
kubectl scale deployment -n spinwheel spinwheel-backend --replicas=3

# Scale frontend for more web traffic
kubectl scale deployment -n spinwheel spinwheel-frontend --replicas=5
```

## License

MIT
