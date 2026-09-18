# Pond Agent for OpenServ

Pond Agent turns cross-chain price differences into decisions backed by executable evidence. It combines SERV Reasoning, Robinhood Chain MCP market tools, and this repository's lifecycle scanner.

The key distinction is simple: a spread is not profit. A route becomes `actionable` only after the scanner includes both swaps, the token bridge, stable-capital return, gas, slippage reserves, and successful funded transaction simulations. Raw quotes and reverted routes remain visible as rejected evidence.

## OpenServ hackathon fit

- **Track:** Mainnet & MCP
- **Working product:** SERV Reasoning agent with four deterministic market capabilities plus 105 Robinhood Chain MCP tools
- **User readiness:** read-only by design; it cannot sign or broadcast
- **Revenue path:** subscription monitoring and execution handoff for traders, treasuries, and market makers

## Run

```sh
npm install
cp .env.example .env
# Add the dedicated key created in the SERV Reasoning console.
npm start
```

The CLI calls the current OpenAI-compatible SERV Reasoning endpoint and lets SERV choose among deterministic lifecycle tools and Robinhood Chain MCP tools. Run one prompt directly with:

```sh
npm run ask -- "Why is the positive msUSD quote rejected?"
```

Open the evidence dashboard with `npm run dashboard` and visit `http://127.0.0.1:4180`.

The repository includes a sanitized evidence fixture so the decision flow works after cloning. To enable fresh lifecycle scans, set `POND_SCANNER_ROOT` to a checkout of the companion `dex-arb-starter` scanner. Pond Agent automatically prefers that checkout's current report when present.

## Demo prompts

1. `Refresh the portfolio using $500 and require at least $1 protected net.`
2. `Show only actionable ponds and explain the evidence gate.`
3. `Inspect EDEL and compare its current state with its bridge latency.`
4. `Use Robinhood Chain tools to inspect USDG and the WETH/USDG market, then explain whether that is enough to call an arbitrage.`
5. `Why is the positive msUSD quote rejected?`

## Capabilities

- `portfolio_status` reads the current cross-chain decision report.
- `inspect_pond` returns the complete evidence for one token.
- `refresh_read_only_portfolio` runs a fresh quote-and-simulation scan without transactions.
- `explain_execution_gate` gives a deterministic trade/reject decision.
- Robinhood Chain MCP tools are registered automatically for onchain reads, stock-token checks, USDG, Uniswap v4, oracles, and unsigned transaction construction.

## Safety boundary

Pond Agent never holds keys, signs messages, approves tokens, or broadcasts transactions. It produces a reviewable execution decision for an external wallet policy layer.
