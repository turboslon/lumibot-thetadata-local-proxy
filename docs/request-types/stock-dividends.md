# Stock Dividends

**Purpose**: Retrieve dividend history for stocks.

**URL**: `/v2/hist/stock/dividend`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Stock symbol (e.g., `"AAPL"`)
- `start_date` (string): Start date in `YYYYMMDD` format
- `end_date` (string): End date in `YYYYMMDD` format
- `use_csv` (string): Response format. Set to `"false"` for JSON
- `pretty_time` (string): Time formatting. Set to `"false"` for raw timestamps

**Pre-defined Constants**:
- `THETA_V2_DIVIDEND_ENDPOINT = "/v2/hist/stock/dividend"`
- `EVENT_CACHE_PAD_DAYS = int(os.environ.get("THETADATA_EVENT_CACHE_PAD_DAYS", "60"))`
- `EVENT_CACHE_MIN_DATE = date(1950, 1, 1)`
- `EVENT_CACHE_MAX_DATE = date(2100, 12, 31)`
- `DIVIDEND_VALUE_COLUMNS = ("amount", "cash", "dividend", "cash_amount")`
- `DIVIDEND_DATE_COLUMNS = ("ex_dividend_date", "ex_date", "ex_dividend", "execution_date")`

**Usage**: Called by `_download_corporate_events()` for dividend data. Used for corporate action normalization.

**Note**: This is a V2 endpoint - dividends/splits are only available on the legacy v2 REST surface.

**Request Example**:
```json
{
  "root": "AAPL",           // Stock symbol
  "start_date": "20240101",  // Start date: YYYYMMDD
  "end_date": "20241231",    // End date: YYYYMMDD
  "use_csv": "false",         // Response format: false for JSON
  "pretty_time": "false"       // Time formatting: false for raw timestamps
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["date", "amount", "record_date", "pay_date", "declared_date", "frequency"]
  },
  "response": [
    [20240115, 0.24, 20240115, 20240215, "Q"],
    [20240415, 0.25, 20240415, 20240515, "Q"],
    [20240715, 0.26, 20240715, 20240815, "Q"],
    [20241015, 0.27, 20241015, 20241115, "Q"]
  ]
}
```

**Response Fields**:
- `header.format` (array of strings): Column names in the response
- `response` (array of arrays): Array of data rows, each containing values for all columns in `format`

**Column Descriptions**:
- `date` (string): Trading date in `YYYYMMDD` format
- `amount` (number): Dividend amount per share
- `record_date` (string): Record date in `YYYYMMDD` format
- `pay_date` (string): Payment date in `YYYYMMDD` format
- `declared_date` (string): Declaration date in `YYYYMMDD` format
- `frequency` (string): Dividend frequency (e.g., "Q" for quarterly)

**Expected Behavior**:
- HTTP 200 → Returns dividend history for requested date range
- HTTP 472 → No data available for this symbol/date range
- HTTP 404/410 → Invalid symbol or parameters
