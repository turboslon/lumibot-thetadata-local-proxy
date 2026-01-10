# Terminal Shutdown

**Purpose**: Request graceful shutdown of the ThetaData Terminal.

**URL**: `/v3/terminal/shutdown` (primary) or `/v3/system/terminal/shutdown` (legacy)

**Method**: `GET`

**Query Parameters**: None

**Pre-defined Constants**:
- `shutdown_paths = ("/v3/terminal/shutdown", "/v3/system/terminal/shutdown")`

**Usage**: Called by `_request_terminal_shutdown()` and `shutdown_theta_terminal()` to stop the terminal process.

**Note**: The legacy path is provided as a fallback for older terminal versions.

**Request Example**:
```json
{
  // No query parameters or body required
}
```

**Response Format**:
```json
{
  // Response body is not examined; success is determined by HTTP status code
}
```

**Response Fields**:
- HTTP status code determines success:
  - `200-499`: Shutdown request accepted, terminal will stop gracefully
  - `500+`: Server error, try next path in fallback list

**Expected Behavior**:
- HTTP 200-499 → Terminal shutdown initiated successfully
- HTTP 500+ → Server error, try legacy fallback path
- Network error → Try next path in fallback list
- Returns `True` if any path succeeds with status < 500, `False` otherwise

**Implementation Notes**:
```javascript
// From _request_terminal_shutdown() in thetadata_helper.py:
const shutdown_paths = [
  "/v3/terminal/shutdown",
  "/v3/system/terminal/shutdown"  // legacy fallback
];

for (const path of shutdown_paths) {
  const shutdown_url = `${_current_base_url()}${path}`;
  try {
    const resp = await fetch(shutdown_url, { timeout: 1000 });
    const status_code = resp.status;
    if (status_code < 500) {
      return true;  // Shutdown accepted
    }
  } catch (error) {
    continue;  // Try next path
  }
}
return false;  // All paths failed
```
