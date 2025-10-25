# Solana Whale Watcher 2.0 - User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Installation & Setup](#installation--setup)
3. [How the Program Works](#how-the-program-works)
4. [Features & Capabilities](#features--capabilities)
5. [Using the CLI](#using-the-cli)
6. [Understanding the Output](#understanding-the-output)
7. [Trading Strategies Explained](#trading-strategies-explained)
8. [Risk Management](#risk-management)
9. [Advanced Configuration](#advanced-configuration)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

**Solana Whale Watcher 2.0** is a CLI-based trading assistant designed to help Solana traders identify and evaluate high-velocity memecoin opportunities using data-driven strategies and disciplined risk management.

The tool analyzes tokens by:

- Tracking whale wallet movements and holder concentration
- Monitoring fresh Pump.fun launches for sniper opportunities
- Identifying momentum breakouts using volume and price data
- Suggesting grid trading parameters for ranging markets
- Enforcing strict bankroll and position sizing rules

---

## Installation & Setup

### Prerequisites

- **Node.js 18+** (Download from [nodejs.org](https://nodejs.org))
- **npm** (comes with Node.js)
- **Git** (optional, for cloning the repository)

### Step 1: Install Dependencies

```bash
cd SolanaWhaleWatcher
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root by copying the example:

```bash
cp .env.example .env
```

Then edit `.env` and add your API keys:

```env
# Required: Helius API Keys
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY_HERE
HELIUS_API_KEY=YOUR_REST_API_KEY_HERE

# Optional: Customize behavior
REPORTING_ENABLED=true
DEFAULT_BANKROLL=5000
MAX_POSITION_PERCENT=0.02
STOP_LOSS_PERCENT=0.08
```

**Where to get API keys:**

- **Helius**: Sign up at [helius.dev](https://helius.dev) for RPC and REST API access
- **Dexscreener**: No API key required (public endpoints)
- **Pump.fun**: No API key required (public endpoints)

### Step 3: Verify Installation

```bash
npm test
```

If all tests pass, you're ready to run the analyzer!

---

## How the Program Works

### Architecture Overview

```text
User Input (Token Mint) 
    ↓
[Data Collection Layer]
    - Helius: Token metadata, holder balances, wallet activity
    - Dexscreener: Price, volume, liquidity
    - Pump.fun: Recent launches
    ↓
[Analysis Layer]
    - Compute holder concentration
    - Track balance changes (leaderboard deltas)
    - Calculate momentum signals (RSI, volume spikes)
    ↓
[Strategy Evaluation Layer]
    - Sniper: Fresh launch scoring
    - Copy Trading: Whale wallet identification
    - Momentum: Breakout probability
    - Grid: Parameter generation
    ↓
[Risk Management Layer]
    - Position sizing (1-2% of bankroll)
    - Stop loss calculation (5-10%)
    - Profit targets (2x, 5x, 10x)
    ↓
[Output Layer]
    - CLI rendering (leaderboard, signals, risk notes)
    - Journal persistence (reports/journal.json)
    - Snapshot export (data/cache/holders/)
```

### Data Flow

1. **Token Analysis Request**: You provide a Solana token mint address
2. **Data Gathering**: Program fetches holder data, market metrics, and whale activity
3. **Leaderboard Computation**: Compares current holders against previous snapshot to detect changes
4. **Strategy Execution**: Each of the 4 strategies evaluates the token based on its playbook
5. **Risk Calculation**: Risk manager validates position sizes and sets stop/profit targets
6. **Results Presentation**: CLI displays signals, narratives, and actionable guidance

---

## Features & Capabilities

### 1. Whale Leaderboard Tracking

- **Top Holder Ranking**: Shows top 10-25 holders by token balance
- **Balance Deltas**: Tracks how much each holder gained/lost since last analysis
- **Rank Changes**: Identifies wallets moving up or down in rankings
- **New Entrants**: Highlights wallets that weren't in previous snapshot

**Use Case**: Detect accumulation (whales buying) or distribution (whales selling)

### 2. Four Trading Strategies

#### A. Sniper Trading

- Monitors Pump.fun for fresh token launches (< 15 minutes old)
- Scores launches based on liquidity, team share, and rug risk
- Provides mint addresses and creator info for bot execution

#### B. Copy Trading Whale Wallets

- Identifies high-performing wallets (65%+ win rate, high PnL)
- Merges data from GMGN and Nansen watchlists
- Provides wallet activity metrics (recent trades, avg profit)

#### C. Momentum / Breakout Trading

- Detects volume spikes and RSI momentum
- Calculates breakout probability
- Warns about whale concentration that could fuel or kill moves

#### D. Automated Bot / Grid Trading

- Generates grid parameters (entry levels, spacing, capital allocation)
- Adapts to volatility (wider grids for high vol, tighter for ranging)
- Provides health checks (liquidity, slippage risk)

### 3. Risk Management Guardrails

- **Position Sizing**: Automatically calculates safe position size (default 2% of bankroll)
- **Stop Loss**: Sets hard stops at 5-10% below entry
- **Profit Targets**: Suggests taking 50% profit at 2× and trailing the rest
- **Warnings**: Flags excessive position sizes or concentrated holdings

### 4. Data Persistence

- **Journaling**: Every analyze run is logged to `reports/journal.json` with timestamp, strategies, and results
- **Snapshot History**: Holder data saved with 10-deep history for trend analysis
- **Exports**: Latest snapshots exported to `reports/` folder for external processing

---

## Using the CLI

### Basic Commands

#### Analyze a Token (One-Time)

```bash
npm run analyze -- --mint=<TOKEN_MINT_ADDRESS>
```

**Example:**

```bash
npm run analyze -- --mint=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
```

#### Stream Mode (Continuous Updates)

```bash
npm run stream -- --mint=<TOKEN_MINT_ADDRESS> --interval=60
```

Refreshes every 60 seconds and prints updated analysis.

#### Backtest Mode (Placeholder)

```bash
npm run backtest -- --mint=<TOKEN_MINT_ADDRESS>
```

Currently reuses analyze logic. Future versions will support historical data replay.

### Command-Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--mint=<address>` | Solana token mint address to analyze | `--mint=DezXAZ8z...` |
| `--bankroll=<usd>` | Override default bankroll for risk sizing | `--bankroll=10000` |
| `--interval=<seconds>` | Refresh rate for stream mode | `--interval=90` |
| `--json` | Output raw JSON instead of formatted text | `--json` |

---

## Understanding the Output

### Leaderboard Section

```text
Leaderboard (Top 10 with Δ balance):
  #1 7xKX...abc1 – balance: 1500000.00 (Δ +50000.00, prev #1)
```

- **#1**: Current rank
- **7xKX...abc1**: Wallet address (truncated)
- **balance**: Current token holdings
- **Δ +50000.00**: Change since last snapshot (+accumulation, -distribution)
- **prev #1**: Previous rank (or "new" if first time)

### Strategy Output

Each strategy section includes:

1. **Narrative**: High-level summary of opportunity or caution
2. **Risk Notes**: Specific warnings and execution guidance
3. **Signals**: Actionable data points with metrics

**Example:**

```text
--- Sniper Trading ---
Narrative: Detected 2 promising Pump.fun listings with low rug scores.
Risk Notes: Execute through MEV-protected wallets; Size entries at 1–2% bankroll
Signals:
  1. PumpToken – launched 8.5m ago
     mint: 6gHj...xyz9
     liquidityUsd: $12,500.00
     rugScore: 25.0%
```

**How to use:**

- If narrative is positive and rug score < 30%, consider sniping via bot
- Always verify contract is renounced and LP locked before entry
- Use Jito tips to avoid MEV sandwich attacks

---

## Trading Strategies Explained

### 1. Sniper Trading

**Goal**: Catch tokens within minutes of Pump.fun launch before Raydium migration

**Signals to Watch:**

- Age < 15 minutes
- Initial liquidity > $10k
- Team share < 20%
- Rug score < 40%

**Execution:**

- Use Trojan Bot or BonkBot for instant fills
- Entry: 1-2% of bankroll
- Exit: 5-10x or when LP migrates to Raydium

**Risks:**

- 95% of Pump.fun tokens rug within 24 hours
- MEV bots can front-run your entries
- Slippage can be 10-20% during congestion

### 2. Copy Trading Whale Wallets

**Goal**: Mirror trades of high-performing wallets

**Signals to Watch:**

- Win rate > 65%
- PnL > $50k
- Recent activity (trades in last 7 days)
- Nansen smart money tags

**Execution:**

- Set alerts for wallet activity (GMGN/Nansen)
- Enter within 5 minutes of whale entry
- Never chase if price already moved 10%+
- Exit when whale scales out (track on-chain)

**Risks:**

- Execution delay (whales dump on followers)
- False signals (wallets can go cold)
- Capital efficiency (many positions open simultaneously)

### 3. Momentum / Breakout Trading

**Goal**: Ride explosive moves confirmed by volume and RSI

**Signals to Watch:**

- Volume spike (24h > 3× 6h average)
- RSI > 65 (but < 85 to avoid overbought)
- Breakout probability > 60%
- Low whale concentration (< 40% in top 5)

**Execution:**

- Wait for 1h close above resistance
- Entry: 2% of bankroll with tight stop (5-8%)
- Exit: 50% at 2×, trail rest with 15% trailing stop

**Risks:**

- False breakouts during Solana congestion
- Whale dumps can reverse moves instantly
- Momentum fades fast in memecoins (hours, not days)

### 4. Automated Bot / Grid Trading

**Goal**: Harvest profits in ranging markets with automated buy/sell orders

**Signals to Watch:**

- Volatility score < 0.15 (ranging, not trending)
- Daily volume > $50k (sufficient liquidity)
- 8-level grid suggested by bot

**Execution:**

- Deploy grid with Sniperoo/Trojan/JitoXAi
- Capital allocation: 10-20% of bankroll max
- Monitor slippage and stop bot if drawdown > 10%

**Risks:**

- Bots underperform in parabolic trends
- Smart contract risk (use audited bots only)
- Fees eat into profits (factor in 0.3-0.5% per trade)

---

## Risk Management

### Position Sizing Rules

```text
Max Position = Bankroll × MAX_POSITION_PERCENT (default 2%)
```

**Example:**

- Bankroll: $5,000
- Max position: $100

**Why this matters:**

- Prevents catastrophic losses from a single trade
- Allows 50+ trades before risking entire bankroll
- Keeps emotions in check (small positions = less stress)

### Stop Loss Discipline

```text
Stop Loss = Entry Price × (1 - STOP_LOSS_PERCENT)
```

**Default:** 8% below entry

**Execution:**

- Set stop immediately after entry (no exceptions)
- Use limit orders, not market (avoid slippage)
- Never move stop lower (only higher to lock profits)

### Profit Taking

1. **First Target (2×)**: Take 50% profit
2. **Second Target (5×)**: Take another 25%
3. **Third Target (10×)**: Let 25% run with trailing stop

**Why partial exits:**

- Locks in gains while leaving room for 10-100× moonshots
- Reduces FOMO (you still have skin in the game)
- Builds discipline (prevents "holding through crashes")

---

## Advanced Configuration

### Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `HELIUS_RPC_URL` | Required | Solana RPC endpoint |
| `HELIUS_API_KEY` | Required | Helius REST API key for metadata |
| `DEXSCREENER_BASE_URL` | `https://api.dexscreener.com` | Dexscreener API endpoint |
| `DEXSCREENER_CHAIN_ID` | `solana` | Blockchain to query |
| `DEXSCREENER_CACHE_TTL_MS` | `15000` | Cache lifetime (15 seconds) |
| `REPORTING_ENABLED` | `true` | Enable journaling and exports |
| `DEFAULT_BANKROLL` | `5000` | Bankroll if not specified in CLI |
| `MAX_POSITION_PERCENT` | `0.02` | Maximum 2% per trade |
| `STOP_LOSS_PERCENT` | `0.08` | 8% stop loss |
| `NANSEN_WATCHLIST` | `` | Comma-separated wallet addresses |

### Customizing Risk Parameters

Edit `.env` to tighten or loosen risk controls:

```bash
# Conservative (1% positions, tight 5% stops)
MAX_POSITION_PERCENT=0.01
STOP_LOSS_PERCENT=0.05

# Aggressive (5% positions, wide 15% stops)
MAX_POSITION_PERCENT=0.05
STOP_LOSS_PERCENT=0.15
```

**Recommendation**: Start conservative until you understand volatility patterns.

---

## Troubleshooting

### Common Issues

#### 1. "No token data found"

**Cause**: Invalid mint address or token not listed on Dexscreener

**Fix:**

- Verify mint address on Solscan
- Try a different token with active DEX trading
- Check Helius API key is valid

#### 2. "Rate limit exceeded"

**Cause**: Too many requests to Helius or Dexscreener

**Fix:**

- Increase `DEXSCREENER_RETRY_BASE_DELAY_MS` in `.env`
- Reduce stream refresh interval: `--interval=120`
- Upgrade Helius plan for higher rate limits

#### 3. "Strategy evaluation failed"

**Cause**: Missing provider data or timeout

**Fix:**

- Check internet connection
- Verify all API endpoints are reachable
- Review logs in console for specific error

#### 4. Tests failing

**Cause**: Stale dependencies or environment issues

**Fix:**

```bash
rm -rf node_modules package-lock.json
npm install
npm test
```

### Debug Mode

Enable verbose logging:

```bash
DEBUG=* npm run analyze -- --mint=<address>
```

---

## Best Practices

1. **Paper Trade First**: Run analyze without executing trades for 1-2 weeks
2. **Start Small**: Begin with minimum bankroll ($500-1000) to learn patterns
3. **Journal Everything**: Review `reports/journal.json` weekly to identify what works
4. **Respect Stops**: Never override risk manager suggestions
5. **Trade During Low Congestion**: 12-18 UTC to minimize slippage
6. **Use MEV Protection**: Jito tips, private RPCs, or MEV-protected wallets
7. **Diversify Strategies**: Don't rely on one strategy (sniper + momentum works well)
8. **Stay Updated**: Monitor Solana network health and adjust strategy weights

---

## Support & Community

- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Tag @ParmsCrypto for strategy questions
- **Updates**: Watch the repo for new provider integrations and strategy modules

---

**Disclaimer**: This tool is for educational purposes. Crypto trading carries significant risk. Never trade more than you can afford to lose. Always do your own research (DYOR).
