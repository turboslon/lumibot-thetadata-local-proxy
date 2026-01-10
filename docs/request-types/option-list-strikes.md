# Option List - Strikes

**Purpose**: Retrieve available strike prices for an option symbol and expiration.

**URL**: `/v3/option/list/strikes`

**Method**: `GET`

**Query Parameters**:
- `symbol` (string): Option root symbol (e.g., `"AAPL"`, `"SPX"`)
- `exp` (string): Expiration date in `YYYYMMDD` format
- `format` (string, optional): Response format. Default: `"json"`

**Pre-defined Constants**:
- `OPTION_LIST_ENDPOINTS["strikes"] = "/v3/option/list/strikes"`

**Usage**: Called by option chain building functions to get available strike prices.

**Request Example**:
```json
{
  "symbol": "AAPL",  // Option root symbol
  "exp": "20250117",    // Expiration date: YYYYMMDD
  "format": "json"      // Optional: Response format (default: "json")
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["strikes"]
  },
  "response": [
    [140, 142.5, 145, 147.5, 150, 152.5, 155, 157.5, 160, ...]
  ]
}
```

**Response Fields**:
- `header.format` (array of strings): Column names in the response
- `response` (array of arrays): Array of data rows, each containing values for all columns in `format`

**Column Descriptions**:
- `strikes` (number): Strike price (decimal)

**Expected Behavior**:
- HTTP 200 → Returns list of available strike prices for the symbol and expiration
- HTTP 472 → No data available for this symbol/expiration combination
- HTTP 404/410 → Invalid symbol, expiration, or parameters
