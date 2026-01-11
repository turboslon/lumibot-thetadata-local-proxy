# ThetaData Queue Service - Technical Stack

## Technologies Used

### Core Framework
- **Next.js 16** - React framework with App Router for API routes
- **TypeScript 5.9** - Type-safe JavaScript
- **React 19** - Frontend framework (minimal UI, service is API-focused)

### Runtime & Package Management
- **Bun** - JavaScript runtime and package manager
- **Node.js Buffer API** - For base64 encoding/decoding of request bodies

### External Dependencies
- **ThetaData Terminal** - Local market data service (V2 or V3 API)

## Development Setup

### Prerequisites
1. Install Bun: https://bun.sh/
2. Install and run ThetaData Terminal locally
3. Clone this repository

### Installation
```bash
bun install
```

### Running the Service
```bash
bun run dev
```

The service starts on port **8080** by default.

### Environment Variables
```bash
# Required - Target ThetaData Terminal URL
THETADATA_BASE_URL=http://127.0.0.1:25503/v2
```

Create `.env` from `.env_template` and configure as needed.

## Technical Constraints

### ThetaData Terminal
- Rate limiting requires sequential request processing
- V2 and V3 APIs have different response formats
- Local Terminal must be running for service to function

### In-Memory Storage
- Queue state is lost on server restart
- Not suitable for production/distributed deployments
- Designed for local development only

### Next.js Development Mode
- Hot reloading may reset module state
- Background processor restarts automatically via `startBackgroundProcesses()`

## Dependencies

### Production Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| next | ^16.1.1 | API routing and server framework |
| react | ^19.2.3 | Required by Next.js |
| react-dom | ^19.2.3 | Required by Next.js |

### Development Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| @types/node | ^25.0.3 | Node.js type definitions |
| @types/react | ^19.2.7 | React type definitions |
| @types/react-dom | ^19.2.3 | React DOM type definitions |
| typescript | ^5.9.3 | TypeScript compiler |

## Tool Usage Patterns

### API Testing
Test the Queue Service endpoints using curl:

```bash
# Submit a request
curl -X POST http://localhost:8080/queue/submit \
  -H "Content-Type: application/json" \
  -d '{"method":"GET","path":"hist/stock/eod","query_params":{"root":"AAPL"}}'

# Check status
curl http://localhost:8080/queue/status/{request_id}

# Get result
curl http://localhost:8080/queue/{request_id}/result

# Get stats
curl http://localhost:8080/queue/stats
```

### Lumibot Integration
Configure Lumibot's QueueClient to point to this service:

```python
# Manual instantiation
client = QueueClient(base_url="http://localhost:8080", api_key="dummy")

# Or via environment variables
# DATADOWNLOADER_BASE_URL=http://127.0.0.1:8080
```

### Debugging
- Console logs show proxied request URLs and response status
- Check queue stats endpoint for processing state
- Failed requests include error messages in result endpoint

## Project Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| dev | `next dev --port 8080` | Start development server |
| build | `next build` | Build for production |
| start | `next start` | Start production server |

### Route Naming
- Dynamic segments use `[paramName]` brackets
- Each route folder contains a `route.ts` file
- HTTP methods are exported functions (GET, POST, etc.)
