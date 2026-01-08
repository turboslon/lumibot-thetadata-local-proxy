# ThetaData Queue Mock

This is a local Next.js service that mocks the ThetaData Queue Client API.
It allows Lumibot's `QueueClient` to function without connecting to the Lumiwealth cloud, effectively acting as a proxy/queue for a local ThetaData Terminal.

## Prerequisites

- [Bun](https://bun.sh/)
- A local ThetaData Terminal running (default: `http://127.0.0.1:25510`)

## Usage

1. **Install Dependencies**:
   ```bash
   bun install
   ```

2. **Start the Server**:
   ```bash
   bun run dev
   ```
   The service will be available at `http://localhost:3000`.

3. **Configure Lumibot**:
   You need to point Lumibot's `QueueClient` to this local service.
   If you are instantiating `QueueClient` manually:
   ```python
   client = QueueClient(base_url="http://localhost:3000", api_key="dummy")
   ```
   
   If you are using `Lumibot`'s `ThetaData` source, check if it accepts a `domain` or `base_url` parameter, or set any relevant environment variables.

## Configuration

You can configure the target ThetaData Terminal URL by setting the environment variable `THETADATA_BASE_URL` when running this service.

```bash
THETADATA_BASE_URL=http://127.0.0.1:25510/v2 bun run dev
```

(Default is `http://127.0.0.1:25510/v2`)
