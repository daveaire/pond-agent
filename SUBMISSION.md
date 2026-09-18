# SERV Hackathon submission package

## Project

**Name:** Pond Agent

**Track:** Mainnet & MCP

**One-line concept:** An OpenServ agent that searches cross-chain markets, rejects fake spreads with funded transaction simulations, and surfaces only fully costed executable opportunities.

## Application answers

### What are you building?

Pond Agent is a read-only cross-chain market agent for Robinhood Chain and connected networks. It uses Robinhood Chain MCP for onchain context and a lifecycle engine that prices both swaps, token delivery, stable-capital return, gas, bridge fees, price impact, and slippage reserves. OpenServ reasoning lets a user ask for a fresh scan, inspect one candidate, or explain exactly why a tempting quote is rejected.

### What problem does it solve?

Most arbitrage scanners stop at a visible price difference. That produces false opportunities when the bridge cannot replenish inventory, an aggregator route reverts, output is stale, or the stablecoin return erases the edge. Pond Agent makes the execution test the product: a candidate is actionable only when every leg is present and its funded simulations pass.

### Why OpenServ?

OpenServ provides the reasoning and validation layer that chooses between deterministic scanning capabilities and more than 100 Robinhood Chain MCP tools. Users can investigate an opportunity conversationally while the hard execution gate remains deterministic.

### Current working proof

- 40 candidate ponds monitored across EVM and Solana routes.
- Robinhood Chain MCP exposes 105 read/build tools.
- A live msUSD sample advertised more than $23 profit on $400, but Pond Agent rejected it because the destination sale reverted in funded simulation.
- The agent never holds keys, signs, approves, or broadcasts.

### Business model

Pond Agent can be sold as a subscription monitor for traders and treasury teams, with paid alerts and an execution handoff to the customer's policy-controlled wallet. The core value is avoiding false-positive trades and stranded inventory.

## 90-second demo script

1. Ask: **“Refresh the portfolio with $500 and require $1 protected net.”**
2. Show the agent invoking the read-only lifecycle scan and returning zero actionable routes rather than promoting raw spreads.
3. Ask: **“Why is msUSD rejected?”**
4. Show the raw positive quote beside `simulationRejected: true` and the failed Optimism sale.
5. Ask: **“Inspect EDEL and verify the Robinhood Chain market context.”**
6. Show Pond Agent combining its lifecycle decision with Robinhood MCP pool/oracle reads.
7. Close on the rule: **a spread is not profit; executable evidence is profit.**

## Public X post

Published from the entrant's account on 2026-09-19:

<https://x.com/aerialbydavid/status/2101064040542044647>

The post includes the reviewed evidence dashboard image, tags `@openservai`, and links to the public repository through <https://x.gd/pondagent>.

## Submission status

Submitted through the official SERV Hackathon #1 Typeform on **2026-09-19**. The confirmation states that results will be announced by email and on OpenServ X by **2026-10-05**.

The SERV Reasoning account, dedicated project key, required organization data collection setting, public repository, public X post, and submission form are complete. The optional logo was skipped and marketing consent was declined.
