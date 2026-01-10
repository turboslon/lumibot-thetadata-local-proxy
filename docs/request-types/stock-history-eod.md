# Stock History - EOD (End of Day)

**Purpose**: Retrieve official daily OHLC data for stocks with closing auction prices.

**URL**: `/v3/stock/history/eod`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Stock symbol (e.g., `"AAPL"`)
- `start` (string): Start date in `YYYYMMDD` format
- `end` (string): End date in `YYYYMMDD` format
- `adjust` (string, optional): Price adjustment type
- `include_nbbo` (boolean, optional): Include NBBO quote columns

**Pre-defined Constants**:
- `EOD_ENDPOINTS["stock"] = "/v3/stock/history/eod"`

**Usage**: Called by `get_historical_eod_data()` for daily stock bars. Used for day-cadence backtests.

**Request Example**:
```json
{
  "root": "AAPL",           // Stock symbol
  "start": "20240101",      // Start date: YYYYMMDD
  "end": "20240105",        // End date: YYYYMMDD
  "adjust": "splits",         // Optional: Price adjustment type
  "include_nbbo": true       // Optional: Include NBBO quote columns
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["date", "open", "high", "low", "close", "volume", "count"]
  },
  "response": [
    [20240101, 182.50, 183.25, 182.00, 12500000, 150],
    [20240102, 183.00, 183.50, 182.75, 12800000, 200],
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
- HTTP 472 → No data available for this symbol/date range
- HTTP 404/410 → Invalid symbol or parameters
