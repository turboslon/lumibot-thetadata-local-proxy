# Option History - EOD (End of Day)

**Purpose**: Retrieve official daily OHLC data for options with closing auction prices.

**URL**: `/v3/option/history/eod`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Option root symbol (e.g., `"AAPL"`, `"SPX"`, `"SPXW"`)
- `exp` (string): Expiration date in `YYYYMMDD` format
- `strike` (string): Strike price (decimal string)
- `right` (string): Option right - `"C"` for Call, `"P"` for Put
- `start` (string): Start date in `YYYYMMDD` format
- `end` (string): End date in `YYYYMMDD` format
- `adjust` (string, optional): Price adjustment type
- `include_nbbo` (boolean, optional): Include NBBO quote columns

**Pre-defined Constants**:
- `EOD_ENDPOINTS["option"] = "/v3/option/history/eod"`

**Usage**: Called by `get_historical_eod_data()` for daily option bars. Used for day-cadence backtests.

**Request Example**:
```json
{
  "root": "AAPL",           // Option root symbol
  "exp": "20250117",        // Expiration date: YYYYMMDD
  "strike": "150",          // Strike price (decimal string)
  "right": "C",             // Option right: "C" for Call, "P" for Put
  "start": "20240101",      // Start date: YYYYMMDD
  "end": "20240105",        // End date: YYYYMMDD
  "adjust": "splits",       // Optional: Price adjustment type
  "include_nbbo": true      // Optional: Include NBBO quote columns
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["date", "open", "high", "low", "close", "volume", "count"]
  },
  "response": [
    [20240101, 5.20, 5.50, 5.15, 5.45, 1250, 150],
    [20240102, 5.45, 5.60, 5.40, 5.55, 1280, 200],
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
- `close` (number): Official closing price (includes auction)
- `volume` (number): Trading volume
- `count` (number): Number of trades

**Expected Behavior**:
- HTTP 200 → Returns daily OHLC data with official closing prices
- HTTP 472 → No data available for this contract/date range
- HTTP 404/410 → Invalid symbol, parameters, or contract not found
