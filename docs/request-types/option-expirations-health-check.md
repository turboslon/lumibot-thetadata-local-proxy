# Option Expirations Health Check

**Purpose**: Verify terminal responsiveness by querying option expirations for a known symbol.

**URL**: `/v3/option/list/expirations`

**Method**: `GET`

**Query Parameters**:
- `symbol` (string): Symbol to query (default: `"SPY"`)
- `format` (string, optional): Response format. Default: `"json"`

**Pre-defined Constants**:
- `HEALTHCHECK_SYMBOL = os.environ.get("THETADATA_HEALTHCHECK_SYMBOL", "SPY")`
- `READINESS_PROBES` tuple includes this endpoint

**Usage**: Used as a secondary readiness probe when the main status endpoint fails.

**Request Example**:
```json
{
  "symbol": "SPY",  // or any other option root symbol
  "format": "json"
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["expirations"]
  },
  "response": [
    ["20250117", "20250124", "20250131", ...]
  ]
}
```

**Response Fields**:
- `header.format` (array of strings): Column names in the response
- `response` (array of arrays): Array of expiration dates in `YYYYMMDD` format

**Expected Behavior**:
- HTTP 200 with non-empty response → Terminal is responsive
- HTTP 404/410 → Try next probe endpoint
- HTTP 472 → No data available for this symbol
