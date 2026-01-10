# Index History - OHLC (Intraday)

**Purpose**: Retrieve intraday OHLC data for indices.

**URL**: `/v3/index/history/ohlc`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Index symbol (e.g., `"SPX"`, `"NDX"`, `"VIX"`)
- `start` (string): Start date in `YYYYMMDD` format
- `end` (string): End date in `YYYYMMDD` format
- `ivl` (string): Interval label (e.g., `"1m"`, `"5m"`, `"1h"`)
- `start_time` (string, optional): Start time in `HH:MM:SS` format
- `end_time` (string, optional): End time in `HH:MM:SS` format

**Pre-defined Constants**:
- `HISTORY_ENDPOINTS[("index", "ohlc")] = "/v3/index/history/ohlc"`
- `_THETADATA_INDEX_ROOT_ALIASES` for index root symbol mapping

**Usage**: Called by `get_historical_data()` for intraday index price data.

**Request Example**:
```json
{
  "root": "SPX",            // Index symbol
  "start": "20240101",       // Start date: YYYYMMDD
  "end": "20240105",         // End date: YYYYMMDD
  "ivl": "5m",             // Interval: 1m, 5m, 10m, 15m, 30m, 1h, 1d
  "start_time": "09:30:00",  // Optional: Start time HH:MM:SS
  "end_time": "16:00:00"    // Optional: End time HH:MM:SS
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["date", "ms_of_day", "open", "high", "low", "close", "volume", "count"]
  },
  "response": [
    [20240101, 37800000, 4785.50, 4790.25, 4780.00, 4788.75, 125000000, 150],
    [20240101, 37900000, 4788.75, 4795.00, 4785.50, 4792.50, 128000000, 200],
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
- `open` (number): Opening price
- `high` (number): Highest price during interval
- `low` (number): Lowest price during interval
- `close` (number): Closing price
- `volume` (number): Trading volume (notional for indices)
- `count` (number): Number of trades

**Expected Behavior**:
- HTTP 200 → Returns OHLC data for requested date range
- HTTP 472 → No data available for this symbol/date range
- HTTP 404/410 → Invalid symbol or parameters
