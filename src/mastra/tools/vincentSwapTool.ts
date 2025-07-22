import { createTool } from '@mastra/core';
import { z } from 'zod';
import { executeSwap } from '../../vincent/tools/executeSwapTool.js';
import { logger } from '../../utils/logger.js';

/**
 * Vincent Swap Tool - Mastra Wrapper
 * 
 * This tool provides a secure interface for executing token swaps through
 * the Vincent AI framework. It wraps the Vincent executeSwap tool with
 * Mastra's tool interface, enabling the CypherAgent to perform on-chain
 * transactions while respecting all security policies and guardrails.
 * 
 * Security Features:
 * - All trades are validated by Vincent AI policies
 * - Transactions are signed by Lit Protocol PKPs
 * - Token whitelisting and volume limits enforced
 * - Slippage protection and MEV resistance
 */
export const vincentSwapTool = createTool({
  id: 'vincentSwapTool',
  name: 'Vincent AI Secure Swap Tool',
  description: 'Execute secure token swaps through Vincent AI with Lit Protocol PKP signatures',
  
  inputSchema: z.object({
    tokenIn: z.string().describe('Address of the input token to swap from'),
    tokenOut: z.string().describe('Address of the output token to swap to'),
    amountIn: z.string().describe('Amount of input token to swap (in token units)'),
    slippageBps: z.number().int().min(1).max(1000).describe('Maximum slippage in basis points (1-1000)'),
    recipient: z.string().describe('Address to receive the output tokens')
  }),

  outputSchema: z.object({
    txHash: z.string().describe('Transaction hash of the executed swap'),
    amountOut: z.string().describe('Actual amount of output tokens received'),
    gasUsed: z.string().optional().describe('Gas used for the transaction'),
    effectiveSlippage: z.number().optional().describe('Actual slippage experienced'),
    timestamp: z.string().describe('ISO timestamp of transaction execution')
  }),

  execute: async ({ inputData }) => {
    const { tokenIn, tokenOut, amountIn, slippageBps, recipient } = inputData;

    logger.info('Vincent swap tool invoked', {
      tokenIn,
      tokenOut,
      amountIn,
      slippageBps,
      recipient,
      timestamp: new Date().toISOString()
    });

    try {
      // Input validation
      if (!tokenIn || !tokenOut || !amountIn || !recipient) {
        throw new Error('Missing required swap parameters');
      }

      if (tokenIn === tokenOut) {
        throw new Error('Cannot swap token to itself');
      }

      // Validate addresses are proper Ethereum addresses
      if (!/^0x[a-fA-F0-9]{40}$/.test(tokenIn)) {
        throw new Error(`Invalid tokenIn address: ${tokenIn}`);
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(tokenOut)) {
        throw new Error(`Invalid tokenOut address: ${tokenOut}`);
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
        throw new Error(`Invalid recipient address: ${recipient}`);
      }

      // Validate amount is a valid number string
      const amountBigInt = BigInt(amountIn);
      if (amountBigInt <= 0) {
        throw new Error(`Invalid amount: ${amountIn}`);
      }

      logger.info('Calling Vincent executeSwap tool', {
        tokenIn,
        tokenOut,
        amountIn,
        slippageBps
      });

      // Call the Vincent tool with policy enforcement
      const swapResult = await executeSwap({
        tokenIn,
        tokenOut,
        amountIn,
        slippageBps: slippageBps,
        recipient
      });

      if (!swapResult.success || !swapResult.txHash) {
        throw new Error(swapResult.error || 'Swap execution failed');
      }

      logger.info('Vincent swap executed successfully', {
        txHash: swapResult.txHash,
        amountOut: swapResult.amountOut,
        gasUsed: swapResult.gasUsed,
        timestamp: new Date().toISOString()
      });

      return {
        txHash: swapResult.txHash,
        amountOut: swapResult.amountOut || '0',
        gasUsed: swapResult.gasUsed,
        effectiveSlippage: swapResult.effectiveSlippage,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Vincent swap tool execution failed', {
        error: errorMessage,
        tokenIn,
        tokenOut,
        amountIn,
        slippageBps,
        timestamp: new Date().toISOString()
      });

      // Re-throw with context for upstream error handling
      throw new Error(`Vincent swap failed: ${errorMessage}`);
    }
  }
});

logger.info('VincentSwapTool created successfully', {
  toolId: vincentSwapTool.id,
  name: vincentSwapTool.name,
  timestamp: new Date().toISOString()
});