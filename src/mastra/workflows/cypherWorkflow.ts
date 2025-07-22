import { createWorkflow, createStep } from '@mastra/core';
import { z } from 'zod';
import axios from 'axios';
import { logger } from '../../utils/logger.js';

// Input/Output Schemas for type safety and validation
const waitForSignalSchema = {
  input: z.object({}),
  output: z.object({ 
    triggerTime: z.string().datetime() 
  })
};

const fetchMarketDataSchema = {
  input: z.object({ 
    triggerTime: z.string().datetime() 
  }),
  output: z.object({ 
    marketData: z.array(z.number()),
    timestamp: z.string().datetime()
  })
};

const getTradingSignalSchema = {
  input: z.object({ 
    marketData: z.array(z.number()),
    timestamp: z.string().datetime()
  }),
  output: z.object({ 
    signal: z.enum(['BUY', 'SELL', 'HOLD']),
    confidence: z.number().min(0).max(1),
    reasoning: z.string().optional()
  })
};

const decideActionSchema = {
  input: z.object({ 
    signal: z.enum(['BUY', 'SELL', 'HOLD']),
    confidence: z.number(),
    reasoning: z.string().optional()
  }),
  output: z.object({
    action: z.enum(['TRADE', 'WAIT']),
    tradeDirection: z.enum(['BUY', 'SELL']).optional()
  })
};

const executeTradeSchema = {
  input: z.object({
    action: z.enum(['TRADE', 'WAIT']),
    tradeDirection: z.enum(['BUY', 'SELL']).optional(),
    signal: z.enum(['BUY', 'SELL', 'HOLD']),
    confidence: z.number()
  }),
  output: z.object({
    txHash: z.string(),
    tradeDetails: z.object({
      tokenIn: z.string(),
      tokenOut: z.string(),
      amountIn: z.string(),
      amountOut: z.string(),
      slippage: z.number(),
      timestamp: z.string()
    })
  })
};

const reportTradeSchema = {
  input: z.object({
    txHash: z.string(),
    tradeDetails: z.object({
      tokenIn: z.string(),
      tokenOut: z.string(),
      amountIn: z.string(),
      amountOut: z.string(),
      slippage: z.number(),
      timestamp: z.string()
    })
  }),
  output: z.object({
    reportStatus: z.string(),
    recallAgentId: z.string()
  })
};

/**
 * waitForSignal Step
 * Implements the main trading loop timing mechanism
 * Pauses execution for 5 minutes between trading cycles
 */
const waitForSignal = createStep({
  id: 'waitForSignal',
  description: 'Wait for next trading signal interval (5 minutes)',
  inputSchema: waitForSignalSchema.input,
  outputSchema: waitForSignalSchema.output,
  execute: async () => {
    logger.info('Entering waitForSignal - Starting new trading cycle');
    
    // Wait for 5 minutes (300,000 ms) between trading cycles
    await new Promise(resolve => setTimeout(resolve, 300000));
    
    const triggerTime = new Date().toISOString();
    logger.info('Trading cycle triggered', { triggerTime });
    
    return { triggerTime };
  }
});

/**
 * fetchMarketData Step
 * Retrieves the latest 100 hourly price points for the target trading pair
 * Uses CoinGecko API as a reliable data source
 */
const fetchMarketData = createStep({
  id: 'fetchMarketData',
  description: 'Fetch latest market data for price prediction',
  inputSchema: fetchMarketDataSchema.input,
  outputSchema: fetchMarketDataSchema.output,
  execute: async ({ inputData }) => {
    logger.info('Fetching market data', { triggerTime: inputData.triggerTime });
    
    try {
      // Fetch hourly ETH/USD price data from CoinGecko
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/ethereum/market_chart',
        {
          params: {
            vs_currency: 'usd',
            days: '5', // Last 5 days to get ~100+ hourly points
            interval: 'hourly'
          },
          timeout: 10000
        }
      );

      if (!response.data?.prices) {
        throw new Error('Invalid response format from CoinGecko API');
      }

      // Extract closing prices and take the most recent 100 points
      const prices = response.data.prices
        .map((point: [number, number]) => point[1]) // Extract price from [timestamp, price]
        .slice(-100); // Get last 100 price points

      if (prices.length < 50) {
        throw new Error(`Insufficient market data: ${prices.length} points`);
      }

      logger.info('Market data fetched successfully', { 
        dataPoints: prices.length,
        latestPrice: prices[prices.length - 1],
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices)
        }
      });

      return {
        marketData: prices,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to fetch market data', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        triggerTime: inputData.triggerTime
      });
      
      // Return empty array to trigger HOLD signal downstream
      return {
        marketData: [],
        timestamp: new Date().toISOString()
      };
    }
  }
});

/**
 * getTradingSignal Step
 * Queries the Gaia-hosted LSTM model for trading signal prediction
 * Returns signal (BUY/SELL/HOLD) with confidence score
 */
const getTradingSignal = createStep({
  id: 'getTradingSignal',
  description: 'Get trading signal from Gaia-hosted LSTM model',
  inputSchema: getTradingSignalSchema.input,
  outputSchema: getTradingSignalSchema.output,
  execute: async ({ inputData }) => {
    logger.info('Requesting trading signal from Gaia model', {
      dataPointsCount: inputData.marketData.length
    });

    // Handle case where market data fetch failed
    if (inputData.marketData.length === 0) {
      logger.warn('No market data available, defaulting to HOLD');
      return {
        signal: 'HOLD' as const,
        confidence: 0.0,
        reasoning: 'No market data available'
      };
    }

    try {
      const gaiaEndpoint = process.env.GAIA_NODE_URL;
      const gaiaApiKey = process.env.GAIA_API_KEY;
      
      if (!gaiaEndpoint || !gaiaApiKey) {
        throw new Error('Gaia configuration missing');
      }

      // Format market data as JSON string for the model
      const marketDataString = JSON.stringify(inputData.marketData);
      
      const response = await axios.post(
        gaiaEndpoint,
        {
          model: process.env.GAIA_MODEL_NAME || 'cypher-lstm',
          messages: [{
            role: 'user',
            content: `Analyze this price data and provide a trading signal: ${marketDataString}`
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

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from Gaia model');
      }

      const modelOutput = response.data.choices[0].message.content;
      
      // Parse the model output to extract signal and confidence
      // Expected format: "BUY 0.85" or "SELL 0.72" or "HOLD 0.45"
      const parts = modelOutput.trim().split(' ');
      const signal = parts[0] as 'BUY' | 'SELL' | 'HOLD';
      const confidence = parseFloat(parts[1]) || 0.0;

      // Validate signal format
      if (!['BUY', 'SELL', 'HOLD'].includes(signal)) {
        throw new Error(`Invalid signal format: ${signal}`);
      }

      logger.info('Trading signal received', {
        signal,
        confidence,
        modelOutput,
        dataPoints: inputData.marketData.length
      });

      return {
        signal,
        confidence: Math.max(0, Math.min(1, confidence)), // Clamp between 0 and 1
        reasoning: `Model prediction based on ${inputData.marketData.length} price points`
      };

    } catch (error) {
      logger.error('Failed to get trading signal from Gaia', {
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: process.env.GAIA_NODE_URL
      });

      // Default to HOLD with low confidence on API failure
      return {
        signal: 'HOLD' as const,
        confidence: 0.0,
        reasoning: 'Gaia model API unavailable'
      };
    }
  }
});

/**
 * decideAction Step
 * Implements trading decision logic based on signal confidence
 * Only proceeds with trades when confidence exceeds threshold
 */
const decideAction = createStep({
  id: 'decideAction',
  description: 'Decide whether to execute trade based on signal confidence',
  inputSchema: decideActionSchema.input,
  outputSchema: decideActionSchema.output,
  execute: async ({ inputData }) => {
    const { signal, confidence, reasoning } = inputData;
    const minConfidence = parseFloat(process.env.MIN_CONFIDENCE_THRESHOLD || '0.75');

    logger.info('Evaluating trading decision', {
      signal,
      confidence,
      minConfidence,
      reasoning
    });

    // Only trade if signal is BUY or SELL and confidence exceeds threshold
    if ((signal === 'BUY' || signal === 'SELL') && confidence >= minConfidence) {
      logger.info('High confidence trade decision', {
        action: 'TRADE',
        tradeDirection: signal,
        confidence
      });

      return {
        action: 'TRADE' as const,
        tradeDirection: signal
      };
    }

    logger.info('Low confidence or HOLD signal - waiting for next cycle', {
      action: 'WAIT',
      signal,
      confidence,
      minConfidence
    });

    return {
      action: 'WAIT' as const
    };
  }
});

/**
 * executeTrade Step
 * Executes the actual trade through Vincent AI secure tools
 * Handles both BUY and SELL operations with proper error handling
 */
const executeTrade = createStep({
  id: 'executeTrade',
  description: 'Execute trade through Vincent AI secure tools',
  inputSchema: executeTradeSchema.input,
  outputSchema: executeTradeSchema.output,
  execute: async ({ inputData, context }) => {
    const { tradeDirection, confidence } = inputData;

    if (!tradeDirection) {
      throw new Error('Trade direction not specified');
    }

    logger.info('Executing trade', {
      direction: tradeDirection,
      confidence,
      timestamp: new Date().toISOString()
    });

    try {
      // Configure trade parameters based on direction
      const isBuy = tradeDirection === 'BUY';
      const tokenIn = isBuy ? process.env.USDC_ADDRESS : process.env.WETH_ADDRESS;
      const tokenOut = isBuy ? process.env.WETH_ADDRESS : process.env.USDC_ADDRESS;
      
      // Calculate trade amount (example: $1000 USD worth)
      const baseAmountUsd = 1000;
      const amountIn = isBuy 
        ? (baseAmountUsd * 1e6).toString() // USDC has 6 decimals
        : (baseAmountUsd / 2000 * 1e18).toString(); // Approximate ETH amount in wei

      // Get maximum slippage from environment
      const maxSlippageBps = parseInt(process.env.MAX_SLIPPAGE_BPS || '300');

      // Call Vincent swap tool through Mastra context
      const tradeResult = await context.callTool('vincentSwapTool', {
        tokenIn,
        tokenOut,
        amountIn,
        slippageBps: maxSlippageBps,
        recipient: context.agentId || 'cypher-agent'
      });

      logger.info('Trade executed successfully', {
        txHash: tradeResult.txHash,
        tradeDirection,
        tokenIn,
        tokenOut,
        amountIn,
        slippage: maxSlippageBps
      });

      return {
        txHash: tradeResult.txHash,
        tradeDetails: {
          tokenIn,
          tokenOut,
          amountIn,
          amountOut: tradeResult.amountOut || '0',
          slippage: maxSlippageBps,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Trade execution failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tradeDirection,
        confidence
      });

      // Re-throw to be handled by workflow error handling
      throw new Error(`Trade execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

/**
 * reportTrade Step
 * Reports successful trades to the Recall platform for leaderboard updates
 * Maintains competition transparency and performance tracking
 */
const reportTrade = createStep({
  id: 'reportTrade',
  description: 'Report trade to Recall platform leaderboard',
  inputSchema: reportTradeSchema.input,
  outputSchema: reportTradeSchema.output,
  execute: async ({ inputData }) => {
    const { txHash, tradeDetails } = inputData;

    logger.info('Reporting trade to Recall platform', {
      txHash,
      timestamp: tradeDetails.timestamp
    });

    try {
      const recallApiUrl = process.env.RECALL_API_URL;
      const recallApiKey = process.env.RECALL_API_KEY;
      const recallAgentId = process.env.RECALL_AGENT_ID || 'project-cypher-agent';

      if (!recallApiUrl || !recallApiKey) {
        throw new Error('Recall platform configuration missing');
      }

      const response = await axios.post(
        `${recallApiUrl}/report-trade`,
        {
          agentId: recallAgentId,
          transactionHash: txHash,
          tradeType: tradeDetails.tokenIn === process.env.USDC_ADDRESS ? 'BUY' : 'SELL',
          tokenIn: tradeDetails.tokenIn,
          tokenOut: tradeDetails.tokenOut,
          amountIn: tradeDetails.amountIn,
          amountOut: tradeDetails.amountOut,
          slippage: tradeDetails.slippage,
          timestamp: tradeDetails.timestamp,
          metadata: {
            framework: 'Project Cypher',
            version: '1.0.0',
            model: 'LSTM-Gaia',
            security: 'Vincent-Lit'
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${recallApiKey}`
          },
          timeout: 15000
        }
      );

      logger.info('Trade reported successfully to Recall', {
        txHash,
        reportId: response.data?.reportId,
        status: response.data?.status
      });

      return {
        reportStatus: response.data?.status || 'success',
        recallAgentId
      };

    } catch (error) {
      logger.error('Failed to report trade to Recall', {
        error: error instanceof Error ? error.message : 'Unknown error',
        txHash
      });

      // Don't fail the entire workflow if reporting fails
      return {
        reportStatus: 'failed',
        recallAgentId: process.env.RECALL_AGENT_ID || 'project-cypher-agent'
      };
    }
  }
});

/**
 * CypherWorkflow - Main Trading State Machine
 * 
 * Implements the complete autonomous trading loop:
 * 1. Wait for signal interval
 * 2. Fetch market data
 * 3. Get AI prediction
 * 4. Decide on action
 * 5. Execute trade (if conditions met)
 * 6. Report to platform
 * 7. Loop back to start
 */
export const cypherWorkflow = createWorkflow({
  name: 'cypherWorkflow',
  description: 'Autonomous trading workflow for Project Cypher',
  
  // Define the workflow graph with proper branching logic
  definition: async () => {
    return waitForSignal
      .then(fetchMarketData)
      .then(getTradingSignal)
      .then(decideAction)
      .branch([
        {
          condition: async ({ inputData }) => inputData.action === 'TRADE',
          workflow: executeTradeWorkflow => executeTradeWorkflow
            .then(reportTrade)
            .then(() => waitForSignal) // Loop back to start
        },
        {
          // Default branch for WAIT action
          condition: async ({ inputData }) => inputData.action === 'WAIT',
          workflow: waitWorkflow => waitWorkflow
            .then(() => waitForSignal) // Loop back to start
        }
      ]);
  }
});

logger.info('CypherWorkflow created successfully', {
  workflow: cypherWorkflow.name,
  steps: ['waitForSignal', 'fetchMarketData', 'getTradingSignal', 'decideAction', 'executeTrade', 'reportTrade'],
  timestamp: new Date().toISOString()
});