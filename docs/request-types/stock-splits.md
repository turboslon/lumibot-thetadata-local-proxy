# Stock Splits

**Purpose**: Retrieve stock split history.

**URL**: `/v2/hist/stock/split`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Stock symbol (e.g., `"AAPL"`)
- `start_date` (string): Start date in `YYYYMMDD` format
- `end_date` (string): End date in `YYYYMMDD` format
- `use_csv` (string): Response format. Set to `"false"` for JSON
- `pretty_time` (string): Time formatting. Set to `"false"` for raw timestamps

**Pre-defined Constants**:
- `THETA_V2_SPLIT_ENDPOINT = "/v2/hist/stock/split"`
- `SPLIT_NUMERATOR_COLUMNS = ("split_to", "to", "numerator", "ratio_to", "after_shares")`
- `SPLIT_DENOMINATOR_COLUMNS = ("split_from", "from", "denominator", "ratio_from", "before_shares")`
- `SPLIT_RATIO_COLUMNS = ("ratio", "split_ratio")`

**Usage**: Called by `_download_corporate_events()` for split data. Used for corporate action normalization and option strike reverse-split adjustments.

**Note**: This is a V2 endpoint - dividends/splits are only available on the legacy v2 REST surface.

**Request Example**:
```json
{
  "root": "AAPL",           // Stock symbol
  "start_date": "20200101",  // Start date: YYYYMMDD
  "end_date": "20241231",    // End date: YYYYMMDD
  "use_csv": "false",         // Response format: false for JSON
  "pretty_time": "false"       // Time formatting: false for raw timestamps
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["ms_of_day", "split_date", "before_shares", "after_shares", "date"]
  },
  "response": [
    [37800000, 20200618, 1, 4, 20200618],
    [37800000, 20220831, 4, 1, 20220831],
    [37800000, 20240831, 20, 1, 20240831]
  ]
}
```

**Response Fields**:
- `header.format` (array of strings): Column names in the response
- `response` (array of arrays): Array of data rows, each containing values for all columns in `format`

**Column Descriptions**:
- `ms_of_day` (number): Milliseconds since midnight
- `split_date` (string): Split date in `YYYYMMDD` format
- `before_shares` (number): Number of shares before split
- `after_shares` (number): Number of shares after split
- `date` (string): Trading date in `YYYYMMDD` format

**Expected Behavior**:
- HTTP 200 → Returns split history for requested date range
- HTTP 472 → No data available for this symbol/date range
- HTTP 404/410 → Invalid symbol or parameters

**Note**: ThetaData V2 returns a row for EVERY trading day with "most recent" split info. The response must be filtered to only actual split events where `date == split_date`.
