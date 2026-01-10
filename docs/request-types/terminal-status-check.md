# Terminal Status Check

**Purpose**: Check if the ThetaData Terminal is running and responsive.

**URL**: `/v3/terminal/mdds/status`

**Method**: `GET`

**Query Parameters**:
- `format` (string, optional): Response format. Default: `"json"`

**Pre-defined Constants**:
- `READINESS_ENDPOINT = "/v3/terminal/mdds/status"`

**Usage**: Used by `_probe_terminal_ready()` to verify terminal availability before making data requests.

**Request Example**:
```json
{
  "format": "json"
}
```

**Response Format**:
```json
{
  "status": "CONNECTED"  // or "READY", "OK", or empty string
}
```

**Response Fields**:
- `status` (string): Terminal connection status. Values:
  - `"CONNECTED"`: Terminal is connected and ready
  - `"READY"`: Terminal is ready to accept requests
  - `"OK"`: Terminal is operational
  - Empty string: Terminal is not ready (treated as failure)

**Expected Behavior**:
- HTTP 200 with `"CONNECTED"`, `"READY"`, or `"OK"` → Terminal is ready
- HTTP 200 with empty body → Terminal is ready
- HTTP 571 or `"SERVER_STARTING"` → Terminal is starting, retry later
- HTTP 404/410 → Try next probe endpoint
