# Verified demo evidence

## Public evidence

- X post: <https://x.com/aerialbydavid/status/2101064040542044647>
- Repository: <https://github.com/daveaire/pond-agent>
- Short repository link used in the post: <https://x.gd/pondagent>

## Live SERV Reasoning run

Run on 2026-09-19 using the dedicated Pond Agent key, the current local lifecycle report, and the Robinhood Chain MCP connection:

```text
Prompt: Why is the positive msUSD quote rejected? Give the observation timestamp,
quoted net, executable net, simulation result, and decision.

Observation timestamp: 2026-09-18T21:03:40.182Z

- Quote: quoted net = $23.31747398428616
- Executable net: unproven (null)
- Simulation result: failed / not run; funded swap simulation was rejected
- Decision: rejected

Numeric evidence:
- quotedNetUsd: 23.31747398428616
- netUsd: null
- eligible: false
- simulated: false
- simulationRejected: true
```

The underlying funded simulations passed the Base purchase and LayerZero bridge calls. The Optimism destination sale reverted with `TF`, so Pond Agent refused to promote the raw spread to executable profit.

## Reproduce

```sh
npm install
cp .env.example .env
# Add SERV_API_KEY to .env
npm run check
npm run inspect:mcp
npm run ask -- "Why is the positive msUSD quote rejected? Give the observation timestamp, quoted net, executable net, simulation result, and decision."
```

The bundled sanitized fixture reproduces the evidence gate after cloning. Set `POND_SCANNER_ROOT` to the companion scanner checkout for fresh read-only lifecycle scans.
