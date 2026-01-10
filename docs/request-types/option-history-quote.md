# Option History - Quote (Intraday)

**Purpose**: Retrieve intraday NBBO quote data for options.

**URL**: `/v3/option/history/quote`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Option root symbol (e.g., `"AAPL"`, `"SPX"`, `"SPXW"`)
- `exp` (string): Expiration date in `YYYYMMDD` format
- `strike` (string): Strike price (decimal string)
- `right` (string): Option right - `"C"` for Call, `"P"` for Put
- `start` (string): Start date in `YYYYMMDD` format
- `end` (string): End date in `YYYYMMDD` format
- `ivl` (string): Interval label (e.g., `"1m"`, `"5m"`, `"1h"`)
- `start_time` (string, optional): Start time in `HH:MM:SS` format
- `end_time` (string, optional): End time in `HH:MM:SS` format

**Pre-defined Constants**:
- `HISTORY_ENDPOINTS[("option", "quote")] = "/v3/option/history/quote"`

**Usage**: Called by `get_historical_data()` for intraday option quote data (bid/ask).

**Request Example**:
```json
{
  "root": "AAPL",           // Option root symbol
  "exp": "20250117",        // Expiration date: YYYYMMDD
  "strike": "150",          // Strike price (decimal string)
  "right": "C",             // Option right: "C" for Call, "P" for Put
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
    [20240101, 37800000, 5.20, 5.25, 50, 25],
    [20240101, 37900000, 5.25, 5.30, 75, 30],
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
- `bid_size` (number): Bid size (number of contracts)
- `ask_size` (number): Ask size (number of contracts)

**Expected Behavior**:
- HTTP 200 → Returns NBBO quote data for requested option contract
- HTTP 472 → No data available for this contract/date range
- HTTP 404/410 → Invalid symbol, parameters, or contract not found
