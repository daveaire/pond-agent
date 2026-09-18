import { connectRobinhoodMcp } from './index.js';

const mcp = await connectRobinhoodMcp();
try {
  console.log(JSON.stringify({
    server: 'Robinhood Chain MCP',
    network: process.env.ROBINHOOD_NETWORK || 'mainnet',
    toolCount: mcp.tools.length,
    tools: mcp.tools.map(tool => tool.function.name),
  }, null, 2));
} finally {
  await mcp.client.close();
}
