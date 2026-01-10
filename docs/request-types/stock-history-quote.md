# Stock History - Quote (Intraday)

**Purpose**: Retrieve intraday NBBO (National Best Bid and Offer) quote data for stocks.

**URL**: `/v3/stock/history/quote`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Stock symbol (e.g., `"AAPL"`)
- `start` (string): Start date in `YYYYMMDD` format
- `end` (string): End date in `YYYYMMDD` format
- `ivl` (string): Interval label (e.g., `"1m"`, `"5m"`, `"1h"`)
- `start_time` (string, optional): Start time in `HH:MM:SS` format
- `end_time` (string, optional): End time in `HH:MM:SS` format

**Pre-defined Constants**:
- `HISTORY_ENDPOINTS[("stock", "quote")] = "/v3/stock/history/quote"`

**Usage**: Called by `get_historical_data()` for intraday stock quote data (bid/ask).

**Request Example**:
```json
{
  "root": "AAPL",           // Stock symbol
  "start": "20240101",      // Start date: YYYYMMDD
  "end": "20240105",        // End date: YYYYMMDD
  "ivl": "5m",              // Interval: 1m, 5m, 10m, 15m, 30m, 1h, 1d
  "start_time": "09:30:00", // Optional: Start time HH:MM:SS
  "end_time": "16:00:00"    // Optional: End time HH:MM:SS
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["date", "ms_of_day", "bid", "ask", "bid_size", "ask_size"]
  },
  "response": [
    [20240101, 37800000, 182.50, 182.75, 100, 50],
    [20240101, 37900000, 182.75, 183.00, 200, 75],
    ...
  ]
}
```

**Response Fields**:
- `header.format` (array of strings): Column names in the response
- `response` (array of arrays): Array of data rows, each containing values for all columns in `format`

**Column Descriptions**:
- `date` (string): Trading date in `YYYYMMDD` format
- `ms_of_day` (number): Milliseconds since midnight
- `bid` (number): Best bid price
- `ask` (number): Best ask price
- `bid_size` (number): Bid size (number of shares)
- `ask_size` (number): Ask size (number of shares)

**Expected Behavior**:
- HTTP 200 → Returns NBBO quote data for requested date range
- HTTP 472 → No data available for this symbol/date range
- HTTP 404/410 → Invalid symbol or parameters
