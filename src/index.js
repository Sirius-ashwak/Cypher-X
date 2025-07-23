#!/usr/bin/env node

/**
 * Project Cypher - Standalone Trading Agent
 * 
 * This is a simplified version that demonstrates the core functionality
 * without the Mastra framework dependency.
 */

import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { executeSwap } from './vincent/tools/executeSwapTool.js';
import { validateTradingGuardrails } from './vincent/policies/tradingGuardrailsPolicy.js';
import axios from 'axios';

// Load environment variables
dotenv.config();

class CypherTradingAgent {
  constructor() {
    this.isRunning = false;
    this.tradingInterval = 5 * 60 * 1000; // 5 minutes
  }

  async start() {
    logger.info('Starting Project Cypher Trading Agent');
    this.isRunning = true;
    
    // Start the main trading loop
    this.runTradingLoop();
  }

  async stop() {
    logger.info('Stopping Project Cypher Trading Agent');
    this.isRunning = false;
  }

  async runTradingLoop() {
    while (this.isRunning) {
      try {
        await this.executeTradingCycle();
        
        // Wait for next cycle
        await new Promise(resolve => setTimeout(resolve, this.tradingInterval));
      } catch (error) {
        logger.error('Trading cycle error', { error: error.message });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
  }

  async executeTradingCycle() {
    logger.info('Starting new trading cycle');

    // Step 1: Fetch market data
    const marketData = await this.fetchMarketData();
    if (!marketData || marketData.length === 0) {
      logger.warn('No market data available, skipping cycle');
      return;
    }

    // Step 2: Get trading signal
    const signal = await this.getTradingSignal(marketData);
    if (!signal || signal.signal === 'HOLD' || signal.confidence < 0.75) {
      logger.info('No high-confidence trading signal, waiting for next cycle', {
        signal: signal?.signal,
        confidence: signal?.confidence
      });
      return;
    }

    // Step 3: Execute trade if conditions are met
    await this.executeTrade(signal);
  }

  async fetchMarketData() {
    try {
      logger.info('Fetching market data from CoinGecko');
      
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/ethereum/market_chart',
        {
          params: {
            vs_currency: 'usd',
            days: '5',
            interval: 'hourly'
          },
          timeout: 10000
        }
      );

      const prices = response.data.prices
        .map(point => point[1])
        .slice(-100);

      logger.info('Market data fetched successfully', { 
        dataPoints: prices.length,
        latestPrice: prices[prices.length - 1]
      });

      return prices;
    } catch (error) {
      logger.error('Failed to fetch market data', { error: error.message });
      return null;
    }
  }

  async getTradingSignal(marketData) {
    try {
      logger.info('Getting trading signal from Gaia model');

      const gaiaEndpoint = process.env.GAIA_NODE_URL;
      const gaiaApiKey = process.env.GAIA_API_KEY;
      
      if (!gaiaEndpoint || !gaiaApiKey) {
        logger.warn('Gaia configuration missing, using mock signal');
        return this.getMockSignal(marketData);
      }

      const response = await axios.post(
        gaiaEndpoint,
        {
          model: process.env.GAIA_MODEL_NAME || 'cypher-lstm',
          messages: [{
            role: 'user',
            content: `Analyze this price data and provide a trading signal: ${JSON.stringify(marketData)}`
          }],
          max_tokens: 100,
          temperature: 0.1
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${gaiaApiKey}`
          },
          timeout: 30000
        }
      );

      const modelOutput = response.data.choices[0].message.content;
      const parts = modelOutput.trim().split(' ');
      const signal = parts[0];
      const confidence = parseFloat(parts[1]) || 0.0;

      logger.info('Trading signal received', { signal, confidence });

      return { signal, confidence };
    } catch (error) {
      logger.error('Failed to get trading signal', { error: error.message });
      return this.getMockSignal(marketData);
    }
  }

  getMockSignal(marketData) {
    // Simple mock signal based on price trend
    const recent = marketData.slice(-10);
    const trend = recent[recent.length - 1] - recent[0];
    
    if (trend > 50) {
      return { signal: 'BUY', confidence: 0.8 };
    } else if (trend < -50) {
      return { signal: 'SELL', confidence: 0.8 };
    } else {
      return { signal: 'HOLD', confidence: 0.5 };
    }
  }

  async executeTrade(signal) {
    try {
      logger.info('Executing trade', { signal: signal.signal, confidence: signal.confidence });

      const isBuy = signal.signal === 'BUY';
      const tokenIn = isBuy ? process.env.USDC_ADDRESS : process.env.WETH_ADDRESS;
      const tokenOut = isBuy ? process.env.WETH_ADDRESS : process.env.USDC_ADDRESS;
      
      // Use default addresses if not configured
      const defaultTokenIn = isBuy ? '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' : '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619';
      const defaultTokenOut = isBuy ? '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' : '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

      const tradeParams = {
        tokenIn: tokenIn || defaultTokenIn,
        tokenOut: tokenOut || defaultTokenOut,
        amountIn: isBuy ? (1000 * 1e6).toString() : (0.5 * 1e18).toString(),
        slippageBps: 300,
        recipient: process.env.PKP_ADDRESS || '0x0000000000000000000000000000000000000000'
      };

      // Validate trade through Vincent policies
      const validation = await validateTradingGuardrails({
        ...tradeParams,
        walletAddress: tradeParams.recipient
      });

      if (!validation.isValid) {
        logger.warn('Trade validation failed', { reason: validation.reason });
        return;
      }

      // Execute the swap
      const result = await executeSwap(tradeParams);

      if (result.success) {
        logger.info('Trade executed successfully', {
          txHash: result.txHash,
          amountOut: result.amountOut
        });

        // Report to Recall platform
        await this.reportTrade(result, signal);
      } else {
        logger.error('Trade execution failed', { error: result.error });
      }

    } catch (error) {
      logger.error('Trade execution error', { error: error.message });
    }
  }

  async reportTrade(tradeResult, signal) {
    try {
      const recallApiUrl = process.env.RECALL_API_URL;
      const recallApiKey = process.env.RECALL_API_KEY;
      
      if (!recallApiUrl || !recallApiKey) {
        logger.warn('Recall configuration missing, skipping trade report');
        return;
      }

      await axios.post(
        `${recallApiUrl}/report-trade`,
        {
          agentId: process.env.RECALL_AGENT_ID || 'project-cypher-agent',
          transactionHash: tradeResult.txHash,
          tradeType: signal.signal,
          timestamp: new Date().toISOString(),
          metadata: {
            framework: 'Project Cypher Standalone',
            confidence: signal.confidence
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${recallApiKey}`
          }
        }
      );

      logger.info('Trade reported to Recall platform');
    } catch (error) {
      logger.error('Failed to report trade', { error: error.message });
    }
  }
}

// Start the agent
const agent = new CypherTradingAgent();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await agent.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await agent.stop();
  process.exit(0);
});

// Start the agent
agent.start().catch(error => {
  logger.error('Failed to start agent', { error: error.message });
  process.exit(1);
});

console.log('Project Cypher Trading Agent started successfully!');
console.log('Press Ctrl+C to stop the agent');