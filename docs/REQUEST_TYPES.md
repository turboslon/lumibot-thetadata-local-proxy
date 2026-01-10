# ThetaData Queue Service - Request Types

This document describes all request types that the `QueueClient` can issue to the ThetaData Terminal. Each request type is treated as a contract specification with its own section.

## Table of Contents

1. [Health & Readiness Checks](#health--readiness-checks)
2. [Stock Data Requests](#stock-data-requests)
3. [Option Data Requests](#option-data-requests)
4. [Index Data Requests](#index-data-requests)
5. [Corporate Actions (V2)](#corporate-actions-v2)
6. [Option List Requests](#option-list-requests)
7. [Terminal Control](#terminal-control)

---

## Health & Readiness Checks

### Terminal Status Check

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

---

### Option Expirations Health Check

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

---

## Stock Data Requests

### Stock History - OHLC (Intraday)

**Purpose**: Retrieve intraday Open-High-Low-Close (OHLC) data for stocks.

**URL**: `/v3/stock/history/ohlc`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Stock symbol (e.g., `"AAPL"`)
- `start` (string): Start date in `YYYYMMDD` format
- `end` (string): End date in `YYYYMMDD` format
- `ivl` (string): Interval label (e.g., `"1m"`, `"5m"`, `"1h"`, `"1d"`)
- `start_time` (string, optional): Start time in `HH:MM:SS` format
- `end_time` (string, optional): End time in `HH:MM:SS` format
- `adjust` (string, optional): Price adjustment type

**Pre-defined Constants**:
- `HISTORY_ENDPOINTS[("stock", "ohlc")] = "/v3/stock/history/ohlc"`
- `INTERVAL_MS_TO_LABEL` mapping for interval conversion

**Usage**: Called by `get_historical_data()` for intraday stock price data.

**Request Example**:
```json
{
  "root": "AAPL",           // Stock symbol
  "start": "20240101",      // Start date: YYYYMMDD
  "end": "20240105",        // End date: YYYYMMDD
  "ivl": "5m",              // Interval: 1m, 5m, 10m, 15m, 30m, 1h, 1d
  "start_time": "09:30:00", // Optional: Start time HH:MM:SS
  "end_time": "16:00:00",   // Optional: End time HH:MM:SS
  "adjust": "splits"         // Optional: Price adjustment type
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["date", "ms_of_day", "open", "high", "low", "close", "volume", "count"]
  },
  "response": [
    [20240101, 37800000, 182.50, 183.25, 182.00, 12500000, 150],
    [20240101, 37900000, 183.00, 183.50, 182.75, 12800000, 200],
    ...
  ]
}
```

**Response Fields**:
- `header.format` (array of strings): Column names in the response
- `response` (array of arrays): Array of data rows, each containing values for all columns in `format`

**Column Descriptions**:
- `date` (string): Trading date in `YYYYMMDD` format
- `ms_of_day` (number): Milliseconds since midnight
- `open` (number): Opening price
- `high` (number): Highest price during interval
- `low` (number): Lowest price during interval
- `close` (number): Closing price
- `volume` (number): Trading volume
- `count` (number): Number of trades

**Expected Behavior**:
- HTTP 200 → Returns OHLC data for requested date range
- HTTP 472 → No data available for this symbol/date range
- HTTP 404/410 → Invalid symbol or parameters

---

### Stock History - Quote (Intraday)

**Purpose**: Retrieve intraday NBBO (National Best Bid and Offer) quote data for stocks.

**URL**: `/v3/stock/history/quote`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Stock symbol (e.g., `"AAPL"`)
- `start` (string): Start date in `YYYYMMDD` format
- `end` (string): End date in `YYYYMMDD` format
- `ivl` (string): Interval label (e.g., `"1m"`, `"5m"`, `"1h"`)
- `start_time` (string, optional): Start time in `HH:MM:SS` format
- `end_time` (string, optional): End time in `HH:MM:SS` format

**Pre-defined Constants**:
- `HISTORY_ENDPOINTS[("stock", "quote")] = "/v3/stock/history/quote"`

**Usage**: Called by `get_historical_data()` for intraday stock quote data (bid/ask).

**Request Example**:
```json
{
  "root": "AAPL",           // Stock symbol
  "start": "20240101",      // Start date: YYYYMMDD
  "end": "20240105",        // End date: YYYYMMDD
  "ivl": "5m",              // Interval: 1m, 5m, 10m, 15m, 30m, 1h, 1d
  "start_time": "09:30:00", // Optional: Start time HH:MM:SS
  "end_time": "16:00:00"    // Optional: End time HH:MM:SS
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["date", "ms_of_day", "bid", "ask", "bid_size", "ask_size"]
  },
  "response": [
    [20240101, 37800000, 182.50, 182.75, 100, 50],
    [20240101, 37900000, 182.75, 183.00, 200, 75],
    ...
  ]
}
```

**Response Fields**:
- `header.format` (array of strings): Column names in the response
- `response` (array of arrays): Array of data rows, each containing values for all columns in `format`

**Column Descriptions**:
- `date` (string): Trading date in `YYYYMMDD` format
- `ms_of_day` (number): Milliseconds since midnight
- `bid` (number): Best bid price
- `ask` (number): Best ask price
- `bid_size` (number): Bid size (number of shares)
- `ask_size` (number): Ask size (number of shares)

**Expected Behavior**:
- HTTP 200 → Returns NBBO quote data for requested date range
- HTTP 472 → No data available for this symbol/date range
- HTTP 404/410 → Invalid symbol or parameters

---

### Stock History - EOD (End of Day)

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

---

## Option Data Requests

### Option History - OHLC (Intraday)

**Purpose**: Retrieve intraday OHLC data for options.

**URL**: `/v3/option/history/ohlc`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Option root symbol (e.g., `"AAPL"`, `"SPX"`, `"SPXW"`)
- `exp` (string): Expiration date in `YYYYMMDD` format
- `strike` (string): Strike price (decimal string, e.g., `"150.5"`)
- `right` (string): Option right - `"C"` for Call, `"P"` for Put
- `start` (string): Start date in `YYYYMMDD` format
- `end` (string): End date in `YYYYMMDD` format
- `ivl` (string): Interval label (e.g., `"1m"`, `"5m"`, `"1h"`)
- `start_time` (string, optional): Start time in `HH:MM:SS` format
- `end_time` (string, optional): End time in `HH:MM:SS` format

**Pre-defined Constants**:
- `HISTORY_ENDPOINTS[("option", "ohlc")] = "/v3/option/history/ohlc"`
- `_THETADATA_INDEX_ROOT_ALIASES` for index option root mapping

**Usage**: Called by `get_historical_data()` for intraday option price data.

**Request Example**:
```json
{
  "root": "AAPL",           // Option root symbol
  "exp": "20250117",        // Expiration date: YYYYMMDD
  "strike": "150",          // Strike price (decimal string)
  "right": "C",             // Option right: "C" for Call, "P" for Put
  "start": "20240101",      // Start date: YYYYMMDD
  "end": "20240105",        // End date: YYYYMMDD
  "ivl": "5m",              // Interval: 1m, 5m, 10m, 15m, 30m, 1h, 1d
  "start_time": "09:30:00", // Optional: Start time HH:MM:SS
  "end_time": "16:00:00"    // Optional: End time HH:MM:SS
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["date", "ms_of_day", "open", "high", "low", "close", "volume", "count"]
  },
  "response": [
    [20240101, 37800000, 5.25, 5.50, 5.20, 5.45, 1250, 150],
    [20240101, 37900000, 5.45, 5.60, 5.40, 5.55, 1280, 200],
    ...
  ]
}
```

**Response Fields**:
- `header.format` (array of strings): Column names in the response
- `response` (array of arrays): Array of data rows, each containing values for all columns in `format`

**Column Descriptions**:
- `date` (string): Trading date in `YYYYMMDD` format
- `ms_of_day` (number): Milliseconds since midnight
- `open` (number): Opening price
- `high` (number): Highest price during interval
- `low` (number): Lowest price during interval
- `close` (number): Closing price
- `volume` (number): Trading volume
- `count` (number): Number of trades

**Expected Behavior**:
- HTTP 200 → Returns OHLC data for requested option contract
- HTTP 472 → No data available for this contract/date range
- HTTP 404/410 → Invalid symbol, parameters, or contract not found

---

### Option History - Quote (Intraday)

**Purpose**: Retrieve intraday NBBO quote data for options.

**URL**: `/v3/option/history/quote`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Option root symbol (e.g., `"AAPL"`, `"SPX"`, `"SPXW"`)
- `exp` (string): Expiration date in `YYYYMMDD` format
- `strike` (string): Strike price (decimal string)
- `right` (string): Option right - `"C"` for Call, `"P"` for Put
- `start` (string): Start date in `YYYYMMDD` format
- `end` (string): End date in `YYYYMMDD` format
- `ivl` (string): Interval label (e.g., `"1m"`, `"5m"`, `"1h"`)
- `start_time` (string, optional): Start time in `HH:MM:SS` format
- `end_time` (string, optional): End time in `HH:MM:SS` format

**Pre-defined Constants**:
- `HISTORY_ENDPOINTS[("option", "quote")] = "/v3/option/history/quote"`

**Usage**: Called by `get_historical_data()` for intraday option quote data (bid/ask).

**Request Example**:
```json
{
  "root": "AAPL",           // Option root symbol
  "exp": "20250117",        // Expiration date: YYYYMMDD
  "strike": "150",          // Strike price (decimal string)
  "right": "C",             // Option right: "C" for Call, "P" for Put
  "start": "20240101",      // Start date: YYYYMMDD
  "end": "20240105",        // End date: YYYYMMDD
  "ivl": "5m",              // Interval: 1m, 5m, 10m, 15m, 30m, 1h, 1d
  "start_time": "09:30:00", // Optional: Start time HH:MM:SS
  "end_time": "16:00:00"    // Optional: End time HH:MM:SS
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["date", "ms_of_day", "bid", "ask", "bid_size", "ask_size"]
  },
  "response": [
    [20240101, 37800000, 5.20, 5.25, 50, 25],
    [20240101, 37900000, 5.25, 5.30, 75, 30],
    ...
  ]
}
```

**Response Fields**:
- `header.format` (array of strings): Column names in the response
- `response` (array of arrays): Array of data rows, each containing values for all columns in `format`

**Column Descriptions**:
- `date` (string): Trading date in `YYYYMMDD` format
- `ms_of_day` (number): Milliseconds since midnight
- `bid` (number): Best bid price
- `ask` (number): Best ask price
- `bid_size` (number): Bid size (number of contracts)
- `ask_size` (number): Ask size (number of contracts)

**Expected Behavior**:
- HTTP 200 → Returns NBBO quote data for requested option contract
- HTTP 472 → No data available for this contract/date range
- HTTP 404/410 → Invalid symbol, parameters, or contract not found

---

### Option History - EOD (End of Day)

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

---

## Index Data Requests

### Index History - OHLC (Intraday)

**Purpose**: Retrieve intraday OHLC data for indices.

**URL**: `/v3/index/history/ohlc`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Index symbol (e.g., `"SPX"`, `"NDX"`, `"VIX"`)
- `start` (string): Start date in `YYYYMMDD` format
- `end` (string): End date in `YYYYMMDD` format
- `ivl` (string): Interval label (e.g., `"1m"`, `"5m"`, `"1h"`)
- `start_time` (string, optional): Start time in `HH:MM:SS` format
- `end_time` (string, optional): End time in `HH:MM:SS` format

**Pre-defined Constants**:
- `HISTORY_ENDPOINTS[("index", "ohlc")] = "/v3/index/history/ohlc"`
- `_THETADATA_INDEX_ROOT_ALIASES` for index root symbol mapping

**Usage**: Called by `get_historical_data()` for intraday index price data.

**Request Example**:
```json
{
  "root": "SPX",            // Index symbol
  "start": "20240101",       // Start date: YYYYMMDD
  "end": "20240105",         // End date: YYYYMMDD
  "ivl": "5m",             // Interval: 1m, 5m, 10m, 15m, 30m, 1h, 1d
  "start_time": "09:30:00",  // Optional: Start time HH:MM:SS
  "end_time": "16:00:00"    // Optional: End time HH:MM:SS
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["date", "ms_of_day", "open", "high", "low", "close", "volume", "count"]
  },
  "response": [
    [20240101, 37800000, 4785.50, 4790.25, 4780.00, 4788.75, 125000000, 150],
    [20240101, 37900000, 4788.75, 4795.00, 4785.50, 4792.50, 128000000, 200],
    ...
  ]
}
```

**Response Fields**:
- `header.format` (array of strings): Column names in the response
- `response` (array of arrays): Array of data rows, each containing values for all columns in `format`

**Column Descriptions**:
- `date` (string): Trading date in `YYYYMMDD` format
- `ms_of_day` (number): Milliseconds since midnight
- `open` (number): Opening price
- `high` (number): Highest price during interval
- `low` (number): Lowest price during interval
- `close` (number): Closing price
- `volume` (number): Trading volume (notional for indices)
- `count` (number): Number of trades

**Expected Behavior**:
- HTTP 200 → Returns OHLC data for requested date range
- HTTP 472 → No data available for this symbol/date range
- HTTP 404/410 → Invalid symbol or parameters

---

### Index History - Price (Intraday)

**Purpose**: Retrieve intraday price data for indices.

**URL**: `/v3/index/history/price`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Index symbol (e.g., `"SPX"`, `"NDX"`, `"VIX"`)
- `start` (string): Start date in `YYYYMMDD` format
- `end` (string): End date in `YYYYMMDD` format
- `ivl` (string): Interval label (e.g., `"1m"`, `"5m"`, `"1h"`)
- `start_time` (string, optional): Start time in `HH:MM:SS` format
- `end_time` (string, optional): End time in `HH:MM:SS` format

**Pre-defined Constants**:
- `HISTORY_ENDPOINTS[("index", "quote")] = "/v3/index/history/price"`

**Usage**: Called by `get_historical_data()` for intraday index price data.

**Request Example**:
```json
{
  "root": "SPX",            // Index symbol
  "start": "20240101",       // Start date: YYYYMMDD
  "end": "20240105",         // End date: YYYYMMDD
  "ivl": "5m",             // Interval: 1m, 5m, 10m, 15m, 30m, 1h, 1d
  "start_time": "09:30:00",  // Optional: Start time HH:MM:SS
  "end_time": "16:00:00"    // Optional: End time HH:MM:SS
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["date", "ms_of_day", "price"]
  },
  "response": [
    [20240101, 37800000, 4788.75],
    [20240101, 37900000, 4792.50],
    ...
  ]
}
```

**Response Fields**:
- `header.format` (array of strings): Column names in the response
- `response` (array of arrays): Array of data rows, each containing values for all columns in `format`

**Column Descriptions**:
- `date` (string): Trading date in `YYYYMMDD` format
- `ms_of_day` (number): Milliseconds since midnight
- `price` (number): Index price at the interval

**Expected Behavior**:
- HTTP 200 → Returns price data for requested date range
- HTTP 472 → No data available for this symbol/date range
- HTTP 404/410 → Invalid symbol or parameters

---

### Index History - EOD (End of Day)

**Purpose**: Retrieve official daily OHLC data for indices.

**URL**: `/v3/index/history/eod`

**Method**: `GET`

**Query Parameters**:
- `root` (string): Index symbol (e.g., `"SPX"`, `"NDX"`, `"VIX"`)
- `start` (string): Start date in `YYYYMMDD` format
- `end` (string): End date in `YYYYMMDD` format
- `adjust` (string, optional): Price adjustment type

**Pre-defined Constants**:
- `EOD_ENDPOINTS["index"] = "/v3/index/history/eod"`

**Usage**: Called by `get_historical_eod_data()` for daily index bars.

**Request Example**:
```json
{
  "root": "SPX",            // Index symbol
  "start": "20240101",       // Start date: YYYYMMDD
  "end": "20240105",         // End date: YYYYMMDD
  "adjust": "splits"          // Optional: Price adjustment type
}
```

**Response Format**:
```json
{
  "header": {
    "format": ["date", "open", "high", "low", "close", "volume", "count"]
  },
  "response": [
    [20240101, 4780.00, 4795.00, 4775.00, 4790.00, 1250000000, 1500],
    [20240102, 4790.00, 4805.00, 4785.00, 4800.00, 1280000000, 2000],
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
- `close` (number): Official closing price
- `volume` (number): Trading volume (notional for indices)
- `count` (number): Number of trades

**Expected Behavior**:
- HTTP 200 → Returns daily OHLC data with official closing prices
- HTTP 472 → No data available for this symbol/date range
- HTTP 404/410 → Invalid symbol or parameters

---

## Corporate Actions (V2)

### Stock Dividends

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

---

### Stock Splits

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

---

## Option List Requests

### Option List - Expirations

**Purpose**: Retrieve available expiration dates for an option symbol.

**URL**: `/v3/option/list/expirations`

**Method**: `GET`

**Query Parameters**:
- `symbol` (string): Option root symbol (e.g., `"AAPL"`, `"SPX"`)
- `format` (string, optional): Response format. Default: `"json"`

**Pre-defined Constants**:
- `OPTION_LIST_ENDPOINTS["expirations"] = "/v3/option/list/expirations"`

**Usage**: Called by `_fetch_expiration_values()` to get available expiration dates for building option chains.

---

### Option List - Strikes

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

---

### Option List - Dates Quote

**Purpose**: Retrieve available quote dates for an option symbol.

**URL**: `/v3/option/list/dates/quote`

**Method**: `GET`

**Query Parameters**:
- `symbol` (string): Option root symbol (e.g., `"AAPL"`, `"SPX"`)
- `format` (string, optional): Response format. Default: `"json"`

**Pre-defined Constants**:
- `OPTION_LIST_ENDPOINTS["dates_quote"] = "/v3/option/list/dates/quote"`

**Usage**: Called to determine which dates have quote data available for options.

---

## Terminal Control

### Terminal Shutdown

**Purpose**: Request graceful shutdown of the ThetaData Terminal.

**URL**: `/v3/terminal/shutdown` (primary) or `/v3/system/terminal/shutdown` (legacy)

**Method**: `GET`

**Query Parameters**: None

**Pre-defined Constants**:
- `shutdown_paths = ("/v3/terminal/shutdown", "/v3/system/terminal/shutdown")`

**Usage**: Called by `_request_terminal_shutdown()` and `shutdown_theta_terminal()` to stop the terminal process.

**Note**: The legacy path is provided as a fallback for older terminal versions.

---

## Request Flow

All requests follow this pattern:

1. **Submit**: Client calls `queue_request()` with URL and parameters
2. **Queue**: Request is submitted to the queue service via `POST /queue/submit`
3. **Process**: Queue service processes request sequentially against ThetaData Terminal
4. **Poll**: Client polls status via `GET /queue/status/{requestId}`
5. **Result**: Client retrieves result via `GET /queue/{requestId}/result`

## Response Format

ThetaData responses follow a standard format:

```json
{
  "header": {
    "format": ["col1", "col2", "col3", ...]
  },
  "response": [
    [row1_col1, row1_col2, row1_col3, ...],
    [row2_col1, row2_col2, row2_col3, ...],
    ...
  ]
}
```

For columnar format (v3), the response may be:

```json
{
  "col1": [val1, val2, ...],
  "col2": [val1, val2, ...],
  "col3": [val1, val2, ...]
}
```

The `get_request()` function automatically converts columnar format to row format.

## Error Handling

- **Status 472**: No data available - returns `None`
- **Status 500**: Permanent failure - request moved to DLQ
- **Status 503**: Service unavailable - retry with backoff
- **Timeout**: Request exceeded wait time - retry with new correlation ID

## Pagination

Large result sets are automatically paginated. The `get_request()` function follows `next_page` URLs and merges all pages into a single response.

## Related Files

- [`lumibot/lumibot/tools/thetadata_queue_client.py`](../lumibot/lumibot/tools/thetadata_queue_client.py) - QueueClient implementation
- [`lumibot/lumibot/tools/thetadata_helper.py`](../lumibot/lumibot/tools/thetadata_helper.py) - Helper functions using QueueClient
- [`lib/queueStore.ts`](../lib/queueStore.ts) - Queue service implementation
