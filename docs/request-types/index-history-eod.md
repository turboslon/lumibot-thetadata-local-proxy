# Index History - EOD (End of Day)

**Purpose**: Retrieve official daily OHLC data for indices.

**URL**: `/v3/index/history/eod`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Index symbol (e.g., `"SPX"`, `"NDX"`, `"VIX"`)
- `start` (string): Start date in `YYYYMMDD` format
- `end` (string): End date in `YYYYMMDD` format
- `adjust` (string, optional): Price adjustment type

**Pre-defined Constants**:
- `EOD_ENDPOINTS["index"] = "/v3/index/history/eod"`

**Usage**: Called by `get_historical_eod_data()` for daily index bars.

**Request Example**:
```json
{
  "root": "SPX",            // Index symbol
  "start": "20240101",       // Start date: YYYYMMDD
  "end": "20240105",         // End date: YYYYMMDD
  "adjust": "splits"          // Optional: Price adjustment type
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["date", "open", "high", "low", "close", "volume", "count"]
  },
  "response": [
    [20240101, 4780.00, 4795.00, 4775.00, 4790.00, 1250000000, 1500],
    [20240102, 4790.00, 4805.00, 4785.00, 4800.00, 1280000000, 2000],
    ...
  ]
}
```

**Response Fields**:
- `header.format` (array of strings): Column names in the response
- `response` (array of arrays): Array of data rows, each containing values for all columns in `format`

**Column Descriptions**:
- `date` (string): Trading date in `YYYYMMDD` format
- `open` (number): Opening price
- `high` (number): Highest price during the day
- `low` (number): Lowest price during the day
- `close` (number): Official closing price
- `volume` (number): Trading volume (notional for indices)
- `count` (number): Number of trades

**Expected Behavior**:
- HTTP 200 → Returns daily OHLC data with official closing prices
- HTTP 472 → No data available for this symbol/date range
- HTTP 404/410 → Invalid symbol or parameters
