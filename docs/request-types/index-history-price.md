# Index History - Price (Intraday)

**Purpose**: Retrieve intraday price data for indices.

**URL**: `/v3/index/history/price`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Index symbol (e.g., `"SPX"`, `"NDX"`, `"VIX"`)
- `start` (string): Start date in `YYYYMMDD` format
- `end` (string): End date in `YYYYMMDD` format
- `ivl` (string): Interval label (e.g., `"1m"`, `"5m"`, `"1h"`)
- `start_time` (string, optional): Start time in `HH:MM:SS` format
- `end_time` (string, optional): End time in `HH:MM:SS` format

**Pre-defined Constants**:
- `HISTORY_ENDPOINTS[("index", "quote")] = "/v3/index/history/price"`

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
    "format": ["date", "ms_of_day", "price"]
  },
  "response": [
    [20240101, 37800000, 4788.75],
    [20240101, 37900000, 4792.50],
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
- `price` (number): Index price at the interval

**Expected Behavior**:
- HTTP 200 → Returns price data for requested date range
- HTTP 472 → No data available for this symbol/date range
- HTTP 404/410 → Invalid symbol or parameters
