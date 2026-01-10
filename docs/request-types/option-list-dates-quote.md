# Option List - Dates Quote

**Purpose**: Retrieve available quote dates for an option symbol.

**URL**: `/v3/option/list/dates/quote`

**Method**: `GET`

**Query Parameters**:
- `symbol` (string): Option root symbol (e.g., `"AAPL"`, `"SPX"`)
- `format` (string, optional): Response format. Default: `"json"`

**Pre-defined Constants**:
- `OPTION_LIST_ENDPOINTS["dates_quote"] = "/v3/option/list/dates/quote"`

**Usage**: Called to determine which dates have quote data available for options.

**Request Example**:
```json
{
  "symbol": "AAPL",  // Option root symbol
  "format": "json"      // Optional: Response format (default: "json")
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["dates"]
  },
  "response": [
    ["20240102", "20240103", "20240104", "20240105", ...]
  ]
}
```

**Response Fields**:
- `header.format` (array of strings): Column names in the response
- `response` (array of arrays): Array of data rows, each containing values for all columns in `format`

**Column Descriptions**:
- `dates` (string): Trading date in `YYYYMMDD` format when quote data is available

**Expected Behavior**:
- HTTP 200 → Returns list of dates with available quote data for the symbol
- HTTP 472 → No data available for this symbol
- HTTP 404/410 → Invalid symbol or parameters
