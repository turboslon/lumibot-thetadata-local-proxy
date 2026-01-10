# ThetaData Queue Service - Request Types

This document describes all request types that the `QueueClient` can issue to the ThetaData Terminal. Each request type is treated as a contract specification with its own section.

## Table of Contents

### Health & Readiness Checks
- [Terminal Status Check](request-types/terminal-status-check.md)
- [Option Expirations Health Check](request-types/option-expirations-health-check.md)

### Stock Data Requests
- [Stock History - OHLC (Intraday)](request-types/stock-history-ohlc.md)
- [Stock History - Quote (Intraday)](request-types/stock-history-quote.md)
- [Stock History - EOD (End of Day)](request-types/stock-history-eod.md)

### Option Data Requests
- [Option History - OHLC (Intraday)](request-types/option-history-ohlc.md)
- [Option History - Quote (Intraday)](request-types/option-history-quote.md)
- [Option History - EOD (End of Day)](request-types/option-history-eod.md)

### Index Data Requests
- [Index History - OHLC (Intraday)](request-types/index-history-ohlc.md)
- [Index History - Price (Intraday)](request-types/index-history-price.md)
- [Index History - EOD (End of Day)](request-types/index-history-eod.md)

### Corporate Actions (V2)
- [Stock Dividends](request-types/stock-dividends.md)
- [Stock Splits](request-types/stock-splits.md)

### Option List Requests
- [Option List - Expirations](request-types/option-list-expirations.md)
- [Option List - Strikes](request-types/option-list-strikes.md)
- [Option List - Dates Quote](request-types/option-list-dates-quote.md)

### Terminal Control
- [Terminal Shutdown](request-types/terminal-shutdown.md)

---

## Request Flow

All requests follow this pattern:

1. **Submit**: Client calls `queue_request()` with URL and parameters
2. **Queue**: Request is submitted to the queue service via `POST /queue/submit`
3. **Process**: Queue service processes request sequentially against ThetaData Terminal
4. **Poll**: Client polls status via `GET /queue/status/{requestId}`
5. **Result**: Client retrieves result via `GET /queue/{requestId}/result`

## Response Format

ThetaData responses follow a standard format:

```json
{
  "header": {
    "format": ["col1", "col2", "col3", ...]
  },
  "response": [
    [row1_col1, row1_col2, row1_col3, ...],
    [row2_col1, row2_col2, row2_col3, ...],
    ...
  ]
}
```

For columnar format (v3), the response may be:

```json
{
  "col1": [val1, val2, ...],
  "col2": [val1, val2, ...],
  "col3": [val1, val2, ...]
}
```

The `get_request()` function automatically converts columnar format to row format.

## Error Handling

- **Status 472**: No data available - returns `None`
- **Status 500**: Permanent failure - request moved to DLQ
- **Status 503**: Service unavailable - retry with backoff
- **Timeout**: Request exceeded wait time - retry with new correlation ID

## Pagination

Large result sets are automatically paginated. The `get_request()` function follows `next_page` URLs and merges all pages into a single response.

## Related Files

- [`lumibot/lumibot/tools/thetadata_queue_client.py`](../lumibot/lumibot/tools/thetadata_queue_client.py) - QueueClient implementation
- [`lumibot/lumibot/tools/thetadata_helper.py`](../lumibot/lumibot/tools/thetadata_helper.py) - Helper functions using QueueClient
- [`lib/queueStore.ts`](../lib/queueStore.ts) - Queue service implementation
