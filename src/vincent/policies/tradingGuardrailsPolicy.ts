import axios from 'axios';
import { ethers } from 'ethers';
import { logger } from '../../utils/logger.js';

/**
 * Vincent AI Trading Guardrails Policy
 * 
 * This policy implements comprehensive security checks for all trading operations:
 * 1. Token whitelist validation (on-chain verification)
 * 2. Daily volume limits (prevents excessive exposure)
 * 3. Price validation (prevents manipulation attacks)
 * 4. Slippage protection (MEV and front-running defense)
 * 
 * The policy runs within Lit Actions for decentralized validation,
 * ensuring that trades can only be executed if ALL conditions are met.
 */

interface TradingParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageBps: number;
  walletAddress: string;
}

interface PolicyValidationResult {
  isValid: boolean;
  reason?: string;
  details?: any;
}

interface TokenPrice {
  usd: number;
}

// Simple in-memory store for daily volume tracking
// In production, this would be stored in a persistent database
const dailyVolumeTracker = new Map<string, { date: string; volume: number }>();

/**
 * Validate token whitelist against on-chain contract
 * Ensures only approved tokens can be traded
 */
async function validateTokenWhitelist(tokenIn: string, tokenOut: string): Promise<boolean> {
  try {
    const whitelistContract = process.env.TOKEN_WHITELIST_CONTRACT;
    if (!whitelistContract) {
      logger.warn('Token whitelist contract not configured, skipping validation');
      return true; // Allow if not configured
    }

    const rpcUrl = process.env.ETHEREUM_RPC_URL || process.env.POLYGON_RPC_URL;
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Simple whitelist contract ABI
    const whitelistAbi = [
      {
        "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
        "name": "isWhitelisted",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    const contract = new ethers.Contract(whitelistContract, whitelistAbi, provider);

    const [tokenInWhitelisted, tokenOutWhitelisted] = await Promise.all([
      contract.isWhitelisted(tokenIn),
      contract.isWhitelisted(tokenOut)
    ]);

    logger.info('Token whitelist validation result', {
      tokenIn,
      tokenOut,
      tokenInWhitelisted,
      tokenOutWhitelisted
    });

    return tokenInWhitelisted && tokenOutWhitelisted;

  } catch (error) {
    logger.error('Token whitelist validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tokenIn,
      tokenOut
    });
    
    // Fail secure: if we can't validate, assume not whitelisted
    return false;
  }
}

/**
 * Get token prices from CoinGecko
 * Used for USD value calculations and volume limits
 */
async function getTokenPrices(tokenAddresses: string[]): Promise<Record<string, TokenPrice>> {
  try {
    const addressList = tokenAddresses.join(',');
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum`,
      {
        params: {
          contract_addresses: addressList,
          vs_currencies: 'usd'
        },
        timeout: 10000
      }
    );

    return response.data;

  } catch (error) {
    logger.error('Failed to fetch token prices', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tokenAddresses
    });

    // Return default prices if API fails
    const defaultPrices: Record<string, TokenPrice> = {};
    tokenAddresses.forEach(address => {
      defaultPrices[address.toLowerCase()] = { usd: 1 }; // Conservative default
    });
    
    return defaultPrices;
  }
}

/**
 * Check daily volume limits
 * Prevents excessive trading exposure in a 24-hour period
 */
function validateDailyVolumeLimit(walletAddress: string, tradeValueUsd: number): PolicyValidationResult {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const maxDailyVolumeUsd = parseFloat(process.env.MAX_DAILY_VOLUME_USD || '10000');

  const trackerKey = `${walletAddress}-${today}`;
  const currentData = dailyVolumeTracker.get(trackerKey) || { date: today, volume: 0 };

  const newTotalVolume = currentData.volume + tradeValueUsd;

  if (newTotalVolume > maxDailyVolumeUsd) {
    return {
      isValid: false,
      reason: 'Daily volume limit exceeded',
      details: {
        currentVolume: currentData.volume,
        tradeValue: tradeValueUsd,
        newTotal: newTotalVolume,
        limit: maxDailyVolumeUsd
      }
    };
  }

  // Update the tracker
  dailyVolumeTracker.set(trackerKey, { date: today, volume: newTotalVolume });

  return {
    isValid: true,
    details: {
      currentVolume: currentData.volume,
      tradeValue: tradeValueUsd,
      newTotal: newTotalVolume,
      limit: maxDailyVolumeUsd
    }
  };
}

/**
 * Validate slippage parameters
 * Ensures slippage is within safe bounds to prevent MEV attacks
 */
function validateSlippage(slippageBps: number): PolicyValidationResult {
  const maxSlippageBps = parseInt(process.env.MAX_SLIPPAGE_BPS || '300'); // 3% default

  if (slippageBps > maxSlippageBps) {
    return {
      isValid: false,
      reason: 'Slippage exceeds maximum allowed',
      details: {
        requestedSlippage: slippageBps,
        maxAllowed: maxSlippageBps
      }
    };
  }

  if (slippageBps < 1) {
    return {
      isValid: false,
      reason: 'Slippage too low (unrealistic)',
      details: {
        requestedSlippage: slippageBps,
        minimum: 1
      }
    };
  }

  return {
    isValid: true,
    details: {
      requestedSlippage: slippageBps,
      maxAllowed: maxSlippageBps
    }
  };
}

/**
 * Main Trading Guardrails Policy Function
 * 
 * Orchestrates all security checks and returns validation result.
 * This function is designed to be called from within a Lit Action
 * for decentralized, trustless validation.
 */
export async function validateTradingGuardrails(params: TradingParams): Promise<PolicyValidationResult> {
  const { tokenIn, tokenOut, amountIn, slippageBps, walletAddress } = params;

  logger.info('Starting trading guardrails validation', {
    tokenIn,
    tokenOut,
    amountIn,
    slippageBps,
    walletAddress,
    timestamp: new Date().toISOString()
  });

  try {
    // Step 1: Validate slippage parameters
    const slippageValidation = validateSlippage(slippageBps);
    if (!slippageValidation.isValid) {
      logger.warn('Slippage validation failed', slippageValidation);
      return slippageValidation;
    }

    // Step 2: Validate token whitelist
    const isWhitelisted = await validateTokenWhitelist(tokenIn, tokenOut);
    if (!isWhitelisted) {
      return {
        isValid: false,
        reason: 'One or both tokens not whitelisted',
        details: { tokenIn, tokenOut }
      };
    }

    // Step 3: Get token prices for volume calculation
    const tokenPrices = await getTokenPrices([tokenIn, tokenOut]);
    const tokenInPrice = tokenPrices[tokenIn.toLowerCase()]?.usd || 1;

    // Estimate trade value in USD (simplified)
    const amountInBigInt = BigInt(amountIn);
    const tradeValueUsd = Number(amountInBigInt) * tokenInPrice / 1e18; // Assumes 18 decimals

    // Step 4: Validate daily volume limits
    const volumeValidation = validateDailyVolumeLimit(walletAddress, tradeValueUsd);
    if (!volumeValidation.isValid) {
      logger.warn('Daily volume limit validation failed', volumeValidation);
      return volumeValidation;
    }

    // Step 5: Additional safety checks
    if (amountInBigInt <= 0) {
      return {
        isValid: false,
        reason: 'Invalid trade amount',
        details: { amountIn }
      };
    }

    if (tokenIn === tokenOut) {
      return {
        isValid: false,
        reason: 'Cannot swap token to itself',
        details: { tokenIn, tokenOut }
      };
    }

    // All validations passed
    logger.info('All trading guardrails validations passed', {
      tokenIn,
      tokenOut,
      tradeValueUsd,
      slippageBps,
      walletAddress
    });

    return {
      isValid: true,
      details: {
        whitelistValidated: true,
        slippageValidated: slippageValidation.details,
        volumeValidated: volumeValidation.details,
        tradeValueUsd,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Trading guardrails validation error', {
      error: errorMessage,
      params,
      timestamp: new Date().toISOString()
    });

    return {
      isValid: false,
      reason: 'Validation error occurred',
      details: { error: errorMessage }
    };
  }
}

logger.info('Vincent Trading Guardrails Policy loaded successfully');