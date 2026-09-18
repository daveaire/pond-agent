import 'dotenv/config';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { stdin as input, stdout as output } from 'node:process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { compactPond, findPond, readJson, summarizePortfolio } from './portfolio.js';

const agentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = process.env.POND_SCANNER_ROOT
  ? path.resolve(process.env.POND_SCANNER_ROOT)
  : path.resolve(agentRoot, '../..');
const livePortfolioPath = process.env.POND_REPORT
  ? path.resolve(process.env.POND_REPORT)
  : path.join(repoRoot, 'reports/pond-portfolio-current.json');
const samplePortfolioPath = path.join(agentRoot, 'data/sample-portfolio.json');
const portfolioPath = fs.existsSync(livePortfolioPath) ? livePortfolioPath : samplePortfolioPath;
const robinhoodMcp = path.join(agentRoot, 'node_modules/.bin/robinhood-chain-mcp');
const endpoint = 'https://inference-api.openserv.ai/v1/chat/completions';
const model = process.env.SERV_MODEL || 'gpt-5.4-mini';

const SYSTEM_PROMPT = [
  'You are Pond Agent, a read-only cross-chain opportunity analyst.',
  'Use the deterministic local lifecycle tools for exact portfolio state and Robinhood Chain MCP tools for current onchain context.',
  'Call a route actionable only when its quote includes every swap, token delivery, stable-capital return, gas cost, price impact and reserve; all required funded transaction simulations pass; and protected net profit clears the requested threshold.',
  'Treat raw price differences, stale quotes, failed simulations, and routes with excluded rebalance costs as rejected evidence.',
  'Never claim a profit from quotedNetUsd alone. Use netUsd only when simulated=true and eligible=true.',
  'When netUsd is null, say "unproven (null)". Never describe a null value as redacted.',
  'You are read-only. Never sign, broadcast, approve, bridge, transfer, or trade. Never ask for or expose a private key.',
  'State the observation timestamp, the decision, the numeric evidence, and the missing gate when rejecting a route.',
].join(' ');

function runPortfolioRefresh({ capitalUsd = 500, minimumNetUsd = 1 }) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path.join(repoRoot, 'scripts/watch-pond-portfolio.js'))) {
      reject(new Error('Live scanner unavailable. Set POND_SCANNER_ROOT to the dex-arb-starter checkout; portfolio_status remains available with the bundled evidence fixture.'));
      return;
    }
    const stamp = `${process.pid}-${Date.now()}`;
    const destination = path.join(os.tmpdir(), `pond-agent-${stamp}.json`);
    const history = path.join(os.tmpdir(), `pond-agent-${stamp}.jsonl`);
    const args = [
      'scripts/watch-pond-portfolio.js', '--samples=1',
      `--fast-size=${capitalUsd}`, `--min-net-usd=${minimumNetUsd}`,
      '--extended-every=1', '--deep-every=1',
      `--output=${destination}`, `--history=${history}`,
    ];
    const child = spawn(process.execPath, args, {
      cwd: repoRoot, env: process.env, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Read-only refresh exceeded five minutes'));
    }, 300_000);
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      try {
        if (code !== 0) throw new Error(stderr.slice(-1200) || `refresh exited ${code}`);
        resolve(readJson(destination));
      } catch (error) { reject(error); }
    });
  });
}

function inspectPond(symbol) {
  const report = readJson(portfolioPath);
  const pond = findPond(report, symbol);
  return pond
    ? { found: true, generatedAt: report.generatedAt, pond: compactPond(pond) }
    : { found: false, symbol };
}

function explainGate(symbol) {
  const result = inspectPond(symbol);
  if (!result.found) return result;
  const p = result.pond;
  const missing = [];
  if (!p.quotePositive && !Number.isFinite(Number(p.netUsd))) missing.push('fresh fully costed positive quote');
  if (!p.simulated) missing.push('successful funded transaction simulation');
  if (!p.eligible) missing.push('all lifecycle and policy gates');
  return {
    ...result,
    decision: p.status === 'actionable' ? 'actionable' : 'do-not-trade',
    missing,
    rule: 'Only status=actionable permits consideration; Pond Agent never executes.',
  };
}

const localTools = [
  {
    type: 'function', function: {
      name: 'portfolio_status',
      description: 'Get the latest decision-grade pond ranking, rejected positive quote artifacts, and evidence counts.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function', function: {
      name: 'inspect_pond',
      description: 'Inspect one token pond, including route, protected net, bridge and simulation evidence.',
      parameters: {
        type: 'object', properties: { symbol: { type: 'string', minLength: 1, maxLength: 20 } },
        required: ['symbol'], additionalProperties: false,
      },
    },
  },
  {
    type: 'function', function: {
      name: 'refresh_read_only_portfolio',
      description: 'Run a fresh, fully costed read-only scan. It submits no transactions.',
      parameters: {
        type: 'object',
        properties: {
          capitalUsd: { type: 'number', minimum: 10, maximum: 10000, default: 500 },
          minimumNetUsd: { type: 'number', minimum: 0, maximum: 1000, default: 1 },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function', function: {
      name: 'explain_execution_gate',
      description: 'Return a deterministic trade or reject decision for one token pond.',
      parameters: {
        type: 'object', properties: { symbol: { type: 'string', minLength: 1, maxLength: 20 } },
        required: ['symbol'], additionalProperties: false,
      },
    },
  },
];

const servTools = [
  { type: 'function', function: { name: 'serv_prompt_guard' } },
  {
    type: 'function', function: {
      name: 'serv_shadow_agent',
      description: 'Validate that the decision cites live evidence and does not promote an unexecutable quote.',
      parameters: {
        type: 'object',
        properties: {
          hint: {
            type: 'string',
            default: 'The answer must identify the timestamp, executable decision, numeric protected net when present, and any failed lifecycle gate.',
          },
          max_iterations: { type: 'integer', default: 3 },
        },
      },
    },
  },
];

export async function connectRobinhoodMcp() {
  const transport = new StdioClientTransport({
    command: robinhoodMcp,
    env: { ...process.env, ROBINHOOD_NETWORK: process.env.ROBINHOOD_NETWORK || 'mainnet' },
    stderr: 'pipe',
  });
  const client = new Client({ name: 'pond-agent', version: '0.2.0' });
  await client.connect(transport);
  const listed = await client.listTools();
  const tools = listed.tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: `[Robinhood Chain MCP] ${tool.description || 'Read or build unsigned onchain data.'}`,
      parameters: tool.inputSchema || { type: 'object', properties: {} },
    },
  }));
  return { client, tools };
}

async function callLocalTool(name, args) {
  if (name === 'portfolio_status') return summarizePortfolio(readJson(portfolioPath));
  if (name === 'inspect_pond') return inspectPond(args.symbol);
  if (name === 'refresh_read_only_portfolio') return summarizePortfolio(await runPortfolioRefresh(args));
  if (name === 'explain_execution_gate') return explainGate(args.symbol);
  throw new Error(`Unknown local tool: ${name}`);
}

async function servCompletion(messages, tools) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SERV_API_KEY}`,
      'Content-Type': 'application/json',
    },
    // Chat Completions accepts function tools with this model only when
    // reasoning effort is disabled; SERV still applies its guard and shadow tools.
    body: JSON.stringify({ model, reasoning_effort: 'none', messages, tools }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 1200);
    throw new Error(`SERV request failed (${response.status}): ${detail}`);
  }
  return response.json();
}

export async function answer(prompt, { includeMcp = true } = {}) {
  if (!process.env.SERV_API_KEY) throw new Error('SERV_API_KEY is required');
  let mcp;
  try {
    mcp = includeMcp ? await connectRobinhoodMcp() : null;
    const tools = [...servTools, ...localTools, ...(mcp?.tools || [])];
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }];
    for (let turn = 0; turn < 8; turn += 1) {
      const completion = await servCompletion(messages, tools);
      const message = completion?.choices?.[0]?.message;
      if (!message) throw new Error('SERV returned no assistant message');
      messages.push(message);
      if (!message.tool_calls?.length) return message.content || '';
      for (const call of message.tool_calls) {
        let result;
        try {
          const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
          if (localTools.some(tool => tool.function.name === call.function.name)) {
            result = await callLocalTool(call.function.name, args);
          } else if (mcp?.tools.some(tool => tool.function.name === call.function.name)) {
            result = await mcp.client.callTool({ name: call.function.name, arguments: args });
          } else {
            throw new Error(`Tool unavailable: ${call.function.name}`);
          }
        } catch (error) { result = { error: error.message }; }
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }
    throw new Error('Tool loop exceeded eight turns');
  } finally {
    await mcp?.client.close().catch(() => {});
  }
}

async function main() {
  const oneShot = process.argv.slice(2).join(' ').trim();
  if (oneShot) {
    console.log(await answer(oneShot));
    return;
  }
  const rl = readline.createInterface({ input, output });
  console.log(`Pond Agent on SERV Reasoning (${model}). Type "exit" to stop.`);
  try {
    while (true) {
      const prompt = (await rl.question('pond> ')).trim();
      if (!prompt || ['exit', 'quit'].includes(prompt.toLowerCase())) break;
      console.log(`\n${await answer(prompt)}\n`);
    }
  } finally { rl.close(); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
