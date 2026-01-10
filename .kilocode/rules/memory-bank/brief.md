# ThetaData Queue Service - Project Brief

A local Queue Service proxy that enables Lumibot's ThetaData backtesting to work with a local ThetaData Terminal instead of the Lumiwealth cloud infrastructure. The service accepts queued requests from Lumibot's `QueueClient`, stores them in-memory, processes them sequentially against ThetaData Terminal, and returns results when polled.

## Tech Stack
- **Framework**: Next.js 16 with TypeScript
- **Runtime**: Bun
- **Port**: 8080
- **Storage**: In-memory Map

## Primary Goal
Implement a Queue Service API that Lumibot's `QueueClient` can connect to for local development and backtesting, mimicking the Lumiwealth cloud Data Downloader interface.

## API Endpoints
- `POST /queue/submit` - Submit requests with correlation ID for idempotency
- `GET /queue/status/[requestId]` - Poll request status
- `GET /queue/[requestId]/result` - Retrieve completed results
- `GET /queue/stats` - Queue statistics
