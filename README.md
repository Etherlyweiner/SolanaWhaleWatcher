# Solana Whale Watcher 2.0

A modular CLI assistant that helps Solana traders evaluate high-velocity memecoin opportunities with discipline. The tool extends the original whale leaderboard script into a strategy hub covering sniper launches, whale copy trading, breakout momentum, and automated grid bots—while enforcing risk management guardrails at every step.

## Why It Exists

- **Solana speed & costs** enable thousands of daily launches, but 95% rug or dump shortly after listing.
- **Bots extract MEV** (sandwich, backrun) costing retail traders 600–800 SOL a day.
- **Winning traders** combine data feeds (GMGN.ai, Dexscreener, Nansen, Pump.fun) with repeatable playbooks and hard stop-losses.

This project packages those playbooks into a CLI that surfaces fresh signals, highlights risk, and keeps traders accountable to bankroll rules.

## Features

- 🧠 **Strategy Evaluations**: Sniper, Whale Copy, Momentum Breakout, and Grid Bot modules share a common interface and emit actionable signals.
- 🛡️ **Risk Manager**: Centralized position sizing, stop-loss, and profit-taking rules (1–2% per trade, 5–10% stops, 50% trim at 2×).
- 📊 **Whale Leaderboard**: Reuses the original dataset to rank top holders and track balance deltas.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Install Dependencies

```bash
npm install
```

### Configure Environment

Create a `.env` file in the project root (optional but recommended):

```env
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_API_KEY=YOUR_HELIUS_REST_API_KEY

# Dexscreener
DEXSCREENER_BASE_URL=https://api.dexscreener.com
DEXSCREENER_CHAIN_ID=solana
DEXSCREENER_CACHE_TTL_MS=15000
DEXSCREENER_RETRY_ATTEMPTS=3

# Reporting & Persistence
REPORTING_ENABLED=true

# Nansen Watchlist
NANSEN_WATCHLIST=Wallet1,Wallet2

# Risk & Bankroll Defaults
DEFAULT_TOKEN_MINT=So11111111111111111111111111111111111111112
MAX_POSITION_PERCENT=0.02
STOP_LOSS_PERCENT=0.08
TAKE_PARTIAL_PERCENT=1.0
DEFAULT_BANKROLL=5000
```

**Key Configuration Options:**

- `REPORTING_ENABLED`: Controls whether analysis results are journaled to `reports/journal.json` and holder snapshots are exported. Set to `false` to disable persistence.
- `DEXSCREENER_*`: Configure Dexscreener API integration for momentum/grid strategies.
- `MAX_POSITION_PERCENT`: Maximum percentage of bankroll to risk on a single trade (default: 2%).
- `STOP_LOSS_PERCENT`: Hard stop-loss threshold (default: 8%).

### Run the CLI

```bash
# One-shot analysis (default command)
npm run analyze -- --mint=<mint-address>

# Continuous streaming refresh
npm run stream -- --mint=<mint-address> --interval=90

# Backtest placeholder (reuses analyze)
npm run backtest -- --mint=<mint-address>
```

Common options:

- `--bankroll=<usd>`: override bankroll for risk sizing.
- `--json`: emit raw JSON output.
- `--interval=<seconds>`: refresh cadence for stream mode.

### Sample CLI Output

```text
=== Solana Whale Watcher 2.0 ===
Token: BONK
Price (approx): 0.00001234 USD
Top Holders Analyzed: 25

Leaderboard (Top 10 with Δ balance):
  #1 7xKX...abc1 – balance: 1500000.00 (Δ +50000.00, prev #1)
  #2 9pQw...def2 – balance: 1200000.00 (Δ -10000.00, prev #2)
  #3 5tYu...ghi3 – balance: 950000.00 (Δ n/a, prev new)
  ...

--- Sniper Trading ---
Narrative: Detected 2 promising Pump.fun listings with low rug scores.
Risk Notes: Execute through MEV-protected wallets; Size entries at 1–2% bankroll
Signals:
  1. PumpToken – launched 8.5m ago
     Liquidity and ownership checks look acceptable.
     mint: 6gHj...xyz9
     liquidityUsd: $12,500.00
```

### Running Tests

The project includes a comprehensive test suite covering providers, strategies, risk management, and integration scenarios.

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/providers/dexscreenerProvider.test.js
```

**Test Coverage:**

- Provider caching and API integration (Helius, Dexscreener)
- Strategy output validation (all 4 strategies)
- Risk manager calculations (position sizing, stops, targets)
- Full analyze pipeline integration
- CLI rendering safety

## Project Structure

```text
src/
├── config/            # Defaults & env parsing
├── core/              # CLI + app orchestration + context loader
├── data/
│   ├── loaders/       # Solana connection + cached holders
│   ├── providers/     # External analytics clients (Helius, Dexscreener, Pump.fun, etc.)
│   └── repositories/  # Domain assemblers (tokens, wallets, strategies)
├── risk/              # Risk manager enforcing bankroll rules
├── strategies/        # Strategy evaluators returning signals
└── util/              # Shared helpers (logging, numbers, etc.)
tests/
├── core/              # App and CLI tests
├── integration/       # End-to-end pipeline tests
├── providers/         # Provider caching and API tests
├── risk/              # Risk manager unit tests
└── strategies/        # Strategy output validation
```

## Extending

1. **Add a provider**: create `src/data/providers/<name>Provider.js` returning normalized objects, then register via `context.registerLazyService` call in `core/context.js`.
2. **Add a strategy**:
   - Implement `evaluate(context, inputs)` returning `{ name, narrative, risk, signals }`.
   - Append the module path to `STRATEGY_MODULES` inside `strategyRepository`.
3. **Wire a UI**: reuse `core/app.analyze()` and `context.services` in a REST API or frontend process.

## Data & Caching

- Default holder data is loaded from the original JSON exports (`holdersbalances.json`, `output3.json`).
- New snapshots are written to `data/cache/holders/` with history management (keeps latest 10 per token).
- When `REPORTING_ENABLED=true`, analysis results are journaled to `reports/journal.json` and snapshots exported to `reports/`.
- Live integrations:
  - **Helius RPC + REST** for token supply, metadata, wallet activity.
  - **Dexscreener** for market/volume metrics, momentum signals.
  - **Pump.fun** for recent launch discovery.
  - **Nansen emulation** uses `NANSEN_WATCHLIST` wallets and Helius activity metrics.

## Risk Management Principles

- Position size <= **1–2%** of bankroll by default (`MAX_POSITION_PERCENT`).
- Hard stops between **5–10%**, partial profit at **2×**, trailing remainder.
- Verify contracts (renounced, locked liquidity) and trade during **12–18 UTC** to avoid congestion.
- Always use MEV-protected Solana wallets (Phantom + Jito tips) and bots (Trojan, BonkBot) responsibly.

## Migrating From v1

- Legacy `SWW.js` logic has been modularized into repositories + utilities.
- RPC keys and token mints live in config instead of hard-coded values.
- JSON outputs persist for backward compatibility; delete them to rebuild from scratch.

## Roadmap

- Expand provider coverage (additional analytics sources, rate-limit aware caching).
- Backtesting engine powered by archived transactions.
- Web dashboard & alerting hooks.
- Integration tests around strategy outputs, risk manager, and provider integrations.

---
Questions or contributions welcome! Tag @ParmsCrypto or open an issue.
