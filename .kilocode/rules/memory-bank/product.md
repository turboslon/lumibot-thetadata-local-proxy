# ThetaData Queue Service - Product Overview

## Why This Project Exists

Lumibot's ThetaData integration is designed for the **Lumiwealth cloud infrastructure**. This creates barriers for developers who want to:

1. **Work offline** - No internet required for backtesting
2. **Reduce costs** - Avoid cloud API costs during heavy backtesting
3. **Use local data** - Leverage a locally running ThetaData Terminal
4. **Debug locally** - Trace issues without external service dependencies

## The Solution

This Queue Service acts as a **local proxy** that mimics the Lumiwealth Data Downloader API, enabling **zero-config local backtesting** by pointing to `localhost:8080`.

## User Experience

1. **Setup** - Start ThetaData Terminal and this Queue Service
2. **Configure** - Set `DATADOWNLOADER_BASE_URL=http://localhost:8080`
3. **Execute** - Run Lumibot backtesting as normal

## Goals

**Primary**: Drop-in replacement requiring no Lumibot code changes

**Secondary**:
- Minimal setup (single env var)
- Handles rate limiting and retries
- Memory-efficient (cleanup on result fetch)

## Target Users

- Lumibot developers building strategies locally
- ThetaData subscribers wanting local data access
- Researchers running extensive backtests
