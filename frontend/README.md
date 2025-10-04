# Spinwheel Frontend

Static web application for the Dynamic Spinwheel.

## Features

- Responsive HTML/CSS/JS interface
- Canvas-based wheel rendering
- Smooth vertical spin animation
- Input field for prompts or lists
- Real-time error handling and loading states
- Nginx-based with API proxying

## Development

### Run locally with dev server

```bash
npm install
npm start
```

Opens at http://localhost:3000 and proxies `/api/*` to `http://localhost:8080`.

### Build Docker image

```bash
docker build -t spinwheel-frontend:latest .
```

### Deploy to Kubernetes

```bash
helm install spinwheel-frontend ../helm/spinwheel-frontend \
  --set ingress.host=spinwheel.yourdomain.com
```

## Architecture

### Static Files
- `index.html` - Main page structure
- `script.js` - Wheel rendering, API calls, spin logic
- `style.css` - Responsive styling
- `wheel.jpg` - Background image

### Nginx Configuration
The `nginx.conf` file:
- Serves static files on port 80
- Proxies `/api/*` requests to `http://spinwheel-backend:8080`
- Enables gzip compression
- Sets proper headers for proxying

### Production Flow
```
User → Ingress (TLS) → Frontend Service → Nginx Container
                                            ├─ Serve static files
                                            └─ Proxy /api/* → Backend Service
```

## Configuration

### Backend API URL

The `script.js` file automatically detects environment:

```javascript
// Development (port 3000): proxy to localhost:8080
// Production: use same origin (nginx handles proxying)
const API_BASE = window.location.port === '3000'
  ? 'http://localhost:8080'
  : window.location.origin;
```

### Nginx Backend Service Name

In `nginx.conf`, update the backend service name if needed:

```nginx
location /api/ {
    proxy_pass http://spinwheel-backend:8080;  # <-- Service name
    ...
}
```

Default is `spinwheel-backend` in the `spinwheel` namespace.

## Customization

### Change Colors

Edit the `colorPalette` array in `script.js`:

```javascript
const colorPalette = [
    "#A71930", "#CE1141", "#DF4601", ...
];
```

### Change Background

Replace `wheel.jpg` or update `style.css`:

```css
body {
    background: dodgerblue;  /* or url('your-image.jpg') */
}
```

### Adjust Wheel Size

Edit `resizeCanvas()` in `script.js`:

```javascript
const width = Math.min(400, window.innerWidth - 60);
const height = Math.min(600, window.innerHeight - 250);
```

## Testing

Open in browser and test:

1. **Comma-separated list**: Enter `"Red, Blue, Green"` → Click Generate
2. **Natural language**: Enter `"programming languages"` → Click Generate
3. **Spin**: Click SPIN button after generating
4. **Persistence**: Refresh page → Wheel should show same options

## Troubleshooting

### API requests fail in production

Check nginx logs:
```bash
kubectl logs -n spinwheel -l app.kubernetes.io/name=spinwheel-frontend
```

Verify backend service exists:
```bash
kubectl get svc -n spinwheel spinwheel-backend
```

### Wheel not rendering

Check browser console (F12) for JavaScript errors.

### Options not persisting

Verify backend is deployed and healthy:
```bash
kubectl get pods -n spinwheel
```
