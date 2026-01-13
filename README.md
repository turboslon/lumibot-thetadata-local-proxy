# ThetaData Local Proxy

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)](https://bun.sh/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)

A local queue service proxy that enables [Lumibot's](https://github.com/Lumiwealth/lumibot) ThetaData backtesting to work with a **local ThetaData Terminal** instead of the Lumiwealth cloud infrastructure.

## Why This Project?

Lumibot's ThetaData integration is designed for the Lumiwealth cloud Data Downloader. This creates barriers for developers who want to:

- **Work offline** — No internet required for backtesting
- **Reduce costs** — Avoid cloud API costs during heavy backtesting
- **Use local data** — Leverage a locally running ThetaData Terminal
- **Debug locally** — Trace issues without external service dependencies

This proxy acts as a **drop-in replacement** for the Lumiwealth Data Downloader API, enabling zero-config local backtesting.

## Features

- ✅ **Drop-in replacement** — No Lumibot code changes required
- ✅ **Queue-based processing** — Handles rate limiting automatically
- ✅ **ThetaData V2/V3 API support** — Compatible with both API versions
- ✅ **Idempotent requests** — Correlation ID support prevents duplicate processing
- ✅ **Memory-efficient** — Automatic cleanup of completed requests
- ✅ **Real-time status** — Queue statistics and request status endpoints

## Prerequisites

- [Bun](https://bun.sh/) runtime
- [ThetaData Terminal](https://www.thetadata.net/) running locally (requires ThetaData subscription)

## Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/thetadata-local-proxy.git
cd thetadata-local-proxy

# Install dependencies
bun install

# Copy environment template
cp .env_template .env
```

## Configuration

Edit `.env` to configure your environment:

```bash
# ThetaData Terminal URL (default: http://127.0.0.1:25503)
THETADATA_BASE_URL=http://127.0.0.1:25503

# Optional: Enable 204 (no data) response logging
LOGGING_DISPLAY_204=false
```

## Usage

### Start the Proxy Server

```bash
# Development mode (with hot reload)
bun run dev

# Production mode
bun run build
bun run start
```

The service will be available at `http://localhost:8080`.

### Configure Lumibot

Point Lumibot's `QueueClient` to this local service:

```python
from lumibot.tools.thetadata_queue_client import QueueClient

# Option 1: Direct instantiation
client = QueueClient(base_url="http://localhost:8080", api_key="dummy")

# Option 2: Environment variable (recommended)
# Set DATADOWNLOADER_BASE_URL=http://localhost:8080 in your environment
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/queue/submit` | POST | Submit a new data request |
| `/queue/status/{requestId}` | GET | Check request processing status |
| `/queue/{requestId}/result` | GET | Retrieve completed request data |
| `/queue/stats` | GET | Get queue statistics |

### Example: Submit a Request

```bash
curl -X POST http://localhost:8080/queue/submit \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "path": "hist/stock/eod",
    "query_params": {
      "root": "AAPL",
      "start_date": "20240101",
      "end_date": "20240131"
    }
  }'
```

### Example: Check Status

```bash
curl http://localhost:8080/queue/status/{request_id}
```

### Example: Get Result

```bash
curl http://localhost:8080/queue/{request_id}/result
```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── queue/              # Queue API endpoints
│   │   ├── submit/         # POST /queue/submit
│   │   ├── status/         # GET /queue/status/{id}
│   │   ├── [requestId]/    # GET /queue/{id}/result
│   │   └── stats/          # GET /queue/stats
│   └── ...
├── lib/                    # Core library
│   ├── handlers/           # Request handlers (stock, options, etc.)
│   ├── factory/            # Handler factory
│   └── queueStore.ts       # In-memory queue storage
├── docs/                   # API documentation
├── test/                   # Test files
└── scripts/                # Utility scripts
```

## Supported Request Types

The proxy supports various ThetaData API request types:

- **Stock Data**: EOD history, intraday quotes, trades
- **Options Data**: EOD history, quotes, OHLC, greeks
- **Reference Data**: Expirations, strikes, roots

See the [docs/REQUEST_TYPES.md](docs/REQUEST_TYPES.md) for the complete list.

## Development

```bash
# Run tests
bun test

# Run in development mode
bun run dev
```

## How It Works

1. **Submit**: Lumibot's `QueueClient` sends requests to `/queue/submit`
2. **Queue**: Requests are stored in-memory with unique IDs
3. **Process**: A background processor forwards requests to ThetaData Terminal sequentially
4. **Poll**: Client polls `/queue/status/{id}` until complete
5. **Retrieve**: Client fetches results from `/queue/{id}/result`
6. **Cleanup**: Completed requests are automatically removed after retrieval

```
┌─────────────┐     ┌─────────────────┐     ┌───────────────────┐
│   Lumibot   │────▶│  Local Proxy    │────▶│ ThetaData Terminal│
│  QueueClient│◀────│  (this service) │◀────│   (local)         │
└─────────────┘     └─────────────────┘     └───────────────────┘
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

For security concerns, please see [SECURITY.md](SECURITY.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Lumiwealth](https://lumiwealth.com/) for the Lumibot trading framework
- [ThetaData](https://www.thetadata.net/) for market data services

---

**Note**: This project is not affiliated with Lumiwealth or ThetaData. It is an independent tool for local development and backtesting.
