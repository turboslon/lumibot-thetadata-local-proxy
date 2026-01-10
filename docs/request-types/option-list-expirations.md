# Option List - Expirations

**Purpose**: Retrieve available expiration dates for an option symbol.

**URL**: `/v3/option/list/expirations`

**Method**: `GET`

**Query Parameters**:
- `symbol` (string): Option root symbol (e.g., `"AAPL"`, `"SPX"`)
- `format` (string, optional): Response format. Default: `"json"`

**Pre-defined Constants**:
- `OPTION_LIST_ENDPOINTS["expirations"] = "/v3/option/list/expirations"`

**Usage**: Called by `_fetch_expiration_values()` to get available expiration dates for building option chains.

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
    "format": ["expirations"]
  },
  "response": [
    ["20250117", "20250124", "20250131", "20250207", ...]
  ]
}
```

**Response Fields**:
- `header.format` (array of strings): Column names in the response
- `response` (array of arrays): Array of data rows, each containing values for all columns in `format`

**Column Descriptions**:
- `expirations` (string): Expiration date in `YYYYMMDD` format

**Expected Behavior**:
- HTTP 200 → Returns list of available expiration dates for the symbol
- HTTP 472 → No data available for this symbol
- HTTP 404/410 → Invalid symbol or parameters
