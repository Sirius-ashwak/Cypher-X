import { Mastra, createWorkflow, createStep } from '@mastra/core';
import { z } from 'zod';
import { logger } from '../utils/logger';

/**
 * Complete Mastra Configuration for Project Cypher
 * 
 * This file sets up the complete Mastra framework with:
 * - Agents for autonomous trading
 * - Tools for secure blockchain interactions
 * - Workflows for trading logic
 */

// Define a simple workflow step
const analyzeMarketStep = createStep({
  id: 'analyzeMarket',
  description: 'Analyze current market conditions',
  inputSchema: z.object({
    symbol: z.string(),
  }),
  outputSchema: z.object({
    signal: z.enum(['BUY', 'SELL', 'HOLD']),
    confidence: z.number().min(0).max(1),
  }),
  execute: async (_context) => {
    logger.info('Analyzing market');
    
    // Simulated market analysis
    const signals = ['BUY', 'SELL', 'HOLD'] as const;
    const signal = signals[Math.floor(Math.random() * signals.length)];
    const confidence = Math.random();
    
    return {
      signal,
      confidence,
    };
  },
});

// Define a simple workflow
export const tradingWorkflow = createWorkflow({
  id: 'tradingWorkflow',
  description: 'Simple trading workflow',
  inputSchema: z.object({
    symbol: z.string(),
  }),
  outputSchema: z.object({
    completed: z.boolean(),
    result: z.string(),
  }),
  steps: [analyzeMarketStep],
});

// Import the agent directly
import { cypherAgent } from './agents/cypherAgent';

// Initialize Mastra with the components
export const mastra: Mastra = new Mastra({
  agents: {
    cypherAgent,
  },
  workflows: {
    tradingWorkflow,
  },
});

// Export individual components
export { tradingTool } from './tools/tradingTool';
export { analyzeMarketStep };

export default mastra;
