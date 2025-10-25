# Solana Whale Watcher 2.0 Architecture

## Goals

- Transform the original monolithic holder watcher into a modular trading assistant focused on Solana memecoins.
- Support four primary trading strategies (Sniper, Copy Trading, Momentum/Breakout, Automated Grid) with reusable data pipelines.
- Centralize risk management guidance so every strategy respects shared guardrails (position sizing, stop losses, profit taking heuristics).
- Keep the system CLI-first while exposing composable services for future bot automation or UI layers.

## High-Level Components

```text
src/
├── config/
│   └── defaults.js
├── core/
│   ├── app.js
│   ├── cli.js
│   └── context.js
├── data/
│   ├── providers/
│   │   ├── gmgnProvider.js
│   │   ├── dexscreenerProvider.js
│   │   ├── nansenProvider.js
│   │   └── pumpfunProvider.js
│   ├── loaders/
│   │   └── solanaLoader.js
│   └── repositories/
│       ├── tokenRepository.js
│       ├── walletRepository.js
│       └── strategyRepository.js
├── risk/
│   └── riskManager.js
├── strategies/
│   ├── sniperStrategy.js
│   ├── copyTradingStrategy.js
│   ├── momentumStrategy.js
│   └── gridStrategy.js
├── util/
│   ├── logger.js
│   └── formatter.js
└── index.js
```

### Core

- **context.js**: Dependency injection container; wires config, providers, and shared services.
- **app.js**: Orchestrates data refresh, strategy execution, and reporting.
- **cli.js**: Presents command surface (`analyze`, `stream`, `backtest`).

### Data Layer

- **loaders/solanaLoader.js**: Wraps `@solana/web3.js` connection logic and exposes token account snapshots and transaction feeds.
- **providers/**: Lightweight clients for third-party analytics (GMGN.ai, Dexscreener, Nansen, Pump.fun). Each returns normalized DTOs so higher layers stay provider-agnostic. Implemented with graceful fallbacks (API key required notices, sample data when offline).
- **repositories/**: Combine raw feeds into enriched domain objects (tokens, wallets, strategy metadata). Persist lightweight caches in `data/` folder to avoid hammering APIs during dev/testing.

### Strategies

Each strategy extends a shared interface (`evaluate(context, inputs)`) returning actionable signals.

1. **SniperStrategy**
   - Focus: New token listings & migration events.
   - Inputs: Pump.fun listings, Raydium pools, Rug-check scores.
   - Output: Early entry opportunities with confidence score, required bot automation steps.

2. **CopyTradingStrategy**
   - Focus: Whale wallet mirroring.
   - Inputs: High-PnL wallet feeds (Nansen, GMGN wallets), on-chain transactions from `solanaLoader`.
   - Output: Follow/unfollow recommendations, lag risk notes.

3. **MomentumStrategy**
   - Focus: Volume & price breakout detection.
   - Inputs: Dexscreener OHLCV, Pulse/Axiom volatility metrics.
   - Output: Entry/exit windows, stop suggestions.

4. **GridStrategy**
   - Focus: Automated range trading.
   - Inputs: Historical volatility, liquidity bands, bot fee schedules.
   - Output: Recommended grid parameters, risk flags (spread width, capital lock-up).

### Risk Management

- Central `riskManager.evaluate(positionPlan)` enforces:
  - Position sizing (no more than 1–2% of bankroll).
  - Stop-loss anchors (5–10%).
  - Profit-taking schedule (scale 50% at 2x, trail remainder).
  - Rug/migration warnings, contract verification status.
- Strategies call the risk manager before finalizing signals, ensuring consistent discipline.

### Reporting

- CLI summarises:
  - Strategy-specific recommendations & risk grades.
  - Wallet/token leaderboards (adapted from original watcher, now modular).
  - Journaling prompts (exportable JSON/CSV for Notion).

## Data Flow

1. **Bootstrap**: `index.js` reads config, initializes context, and runs `cli.handle(argv)`.
2. **Fetch**: Data providers collect latest token, wallet, and pool data. Repositories stitch into domain objects.
3. **Analyze**: Strategies execute sequentially (or in parallel) using shared context. Each returns `StrategySignal` objects.
4. **Risk Check**: Signals pass through `riskManager` for guardrail adjustments.
5. **Output**: CLI renders table summaries, highlights urgent alerts, and saves optional reports under `reports/`.

## Extensibility

- Add `src/strategies/<newStrategy>.js` implementing the shared interface, register in `strategyRepository`.
- Plug new data sources by implementing provider with `fetch()` returning normalized objects.
- Swap CLI for REST/GUI by reusing `app.analyze()` orchestrator.

## Migration from Original Script

- Legacy `SWW.js` logic migrates into `tokenRepository` (holder snapshots) and `formatter` utilities.
- Hard-coded ARB token & RPC keys replaced by config-driven values (`config/defaults.js` + `.env`).
- JSON output files moved to `data/cache/` with timestamped snapshots.

## Security & Operations

- `.env` driven secrets (RPC URLs, API keys). Document expectation in README.
- Rate limiting and exponential backoff in providers to respect third-party APIs.
- Optional dry-run mode ensures no real trades executed without explicit integration.

## Next Steps

1. Scaffold new `src/` directories and shared utilities.
2. Port whale leaderboard into repository pattern.
3. Implement strategy evaluators with placeholder data + risk manager integration.
4. Update README with installation, configuration, and usage instructions reflecting new architecture.
