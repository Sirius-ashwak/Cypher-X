import { ethers } from 'ethers';
import { LitNodeClient } from '@litprotocol/lit-node-client';
import { PKPEthersWallet } from '@litprotocol/pkp-ethers';
import { validateTradingGuardrails } from '../policies/tradingGuardrailsPolicy.js';
import { logger } from '../../utils/logger.js';

/**
 * Vincent Execute Swap Tool
 * 
 * This tool implements secure, policy-gated token swaps using:
 * - Lit Protocol PKPs for non-custodial key management
 * - Vincent AI policies for transaction validation
 * - Uniswap V3 for optimal trade execution
 * - Comprehensive security guardrails and monitoring
 * 
 * The tool ensures that all swaps are:
 * 1. Validated against token whitelists
 * 2. Within daily volume limits
 * 3. Protected by slippage constraints
 * 4. Executed with secure, decentralized signatures
 */

// Uniswap V3 Router ABI (minimal interface)
const UNISWAP_V3_ROUTER_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"internalType": "address", "name": "tokenIn", "type": "address"},
          {"internalType": "address", "name": "tokenOut", "type": "address"},
          {"internalType": "uint24", "name": "fee", "type": "uint24"},
          {"internalType": "address", "name": "recipient", "type": "address"},
          {"internalType": "uint256", "name": "deadline", "type": "uint256"},
          {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
          {"internalType": "uint256", "name": "amountOutMinimum", "type": "uint256"},
          {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"}
        ],
        "internalType": "struct ISwapRouter.ExactInputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactInputSingle",
    "outputs": [{"internalType": "uint256", "name": "amountOut", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  }
];

// ERC20 Token ABI (minimal interface)
const ERC20_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
];

interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageBps: number;
  recipient: string;
}

interface SwapResult {
  success: boolean;
  txHash?: string;
  amountOut?: string;
  gasUsed?: string;
  effectiveSlippage?: number;
  error?: string;
}

/**
 * Initialize Lit Protocol client and PKP wallet
 * Returns configured wallet for transaction signing
 */
async function initializeLitWallet(): Promise<PKPEthersWallet> {
  try {
    const litNodeClient = new LitNodeClient({
      litNetwork: process.env.LIT_NETWORK || 'habanero',
      debug: false
    });

    await litNodeClient.connect();

    const pkpPublicKey = process.env.LIT_PKP_PUBLIC_KEY;
    if (!pkpPublicKey) {
      throw new Error('LIT_PKP_PUBLIC_KEY not configured');
    }

    const pkpWallet = new PKPEthersWallet({
      pkpPubKey: pkpPublicKey,
      rpc: process.env.ETHEREUM_RPC_URL || process.env.POLYGON_RPC_URL,
      litNodeClient
    });

    await pkpWallet.init();
    
    logger.info('Lit Protocol PKP wallet initialized successfully', {
      pkpAddress: await pkpWallet.getAddress(),
      network: process.env.LIT_NETWORK
    });

    return pkpWallet;

  } catch (error) {
    logger.error('Failed to initialize Lit Protocol wallet', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error(`Lit wallet initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get token information (decimals, balance)
 */
async function getTokenInfo(tokenAddress: string, walletAddress: string, provider: ethers.Provider) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  
  const [decimals, balance] = await Promise.all([
    tokenContract.decimals(),
    tokenContract.balanceOf(walletAddress)
  ]);

  return {
    decimals: Number(decimals),
    balance: balance.toString()
  };
}

/**
 * Calculate minimum amount out based on slippage tolerance
 */
function calculateMinAmountOut(expectedAmountOut: bigint, slippageBps: number): bigint {
  const slippageMultiplier = BigInt(10000 - slippageBps);
  return (expectedAmountOut * slippageMultiplier) / BigInt(10000);
}

/**
 * Execute Swap - Main Vincent Tool Function
 * 
 * This function orchestrates the entire swap process:
 * 1. Policy validation through tradingGuardrailsPolicy
 * 2. Token approval if needed
 * 3. Swap execution via Uniswap V3
 * 4. Result validation and logging
 */
export async function executeSwap(params: SwapParams): Promise<SwapResult> {
  const { tokenIn, tokenOut, amountIn, slippageBps, recipient } = params;
  
  logger.info('Starting Vincent executeSwap', {
    tokenIn,
    tokenOut,
    amountIn,
    slippageBps,
    recipient,
    timestamp: new Date().toISOString()
  });

  try {
    // Step 1: Initialize Lit Protocol PKP wallet
    const pkpWallet = await initializeLitWallet();
    const walletAddress = await pkpWallet.getAddress();
    const provider = pkpWallet.provider as ethers.Provider;

    logger.info('PKP wallet ready', { walletAddress });

    // Step 2: Validate against Vincent AI trading guardrails policy
    logger.info('Validating trading guardrails policy');
    
    const policyValidation = await validateTradingGuardrails({
      tokenIn,
      tokenOut,
      amountIn,
      slippageBps,
      walletAddress
    });

    if (!policyValidation.isValid) {
      logger.error('Trading guardrails policy validation failed', {
        reason: policyValidation.reason,
        details: policyValidation.details
      });
      
      return {
        success: false,
        error: `Policy validation failed: ${policyValidation.reason}`
      };
    }

    logger.info('Trading guardrails policy validation passed');

    // Step 3: Get token information and validate balance
    const tokenInInfo = await getTokenInfo(tokenIn, walletAddress, provider);
    const amountInBigInt = BigInt(amountIn);

    if (BigInt(tokenInInfo.balance) < amountInBigInt) {
      return {
        success: false,
        error: `Insufficient balance. Required: ${amountIn}, Available: ${tokenInInfo.balance}`
      };
    }

    // Step 4: Approve Uniswap router if needed
    const routerAddress = process.env.UNISWAP_V3_ROUTER;
    if (!routerAddress) {
      throw new Error('UNISWAP_V3_ROUTER not configured');
    }

    const tokenInContract = new ethers.Contract(tokenIn, ERC20_ABI, pkpWallet);
    
    logger.info('Approving token spend for Uniswap router');
    const approveTx = await tokenInContract.approve(routerAddress, amountInBigInt);
    await approveTx.wait();
    
    logger.info('Token approval confirmed', { txHash: approveTx.hash });

    // Step 5: Prepare swap parameters
    const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now
    const fee = 3000; // 0.3% fee tier (most common)
    
    // For simplicity, we'll estimate amountOutMinimum as 95% of a basic calculation
    // In production, you'd want to call a quoter contract
    const estimatedAmountOut = amountInBigInt * BigInt(98) / BigInt(100); // Very conservative estimate
    const amountOutMinimum = calculateMinAmountOut(estimatedAmountOut, slippageBps);

    const swapParams = {
      tokenIn,
      tokenOut,
      fee,
      recipient,
      deadline,
      amountIn: amountInBigInt,
      amountOutMinimum,
      sqrtPriceLimitX96: 0 // No price limit
    };

    // Step 6: Execute the swap
    const routerContract = new ethers.Contract(routerAddress, UNISWAP_V3_ROUTER_ABI, pkpWallet);
    
    logger.info('Executing Uniswap V3 swap', {
      params: {
        ...swapParams,
        amountIn: swapParams.amountIn.toString(),
        amountOutMinimum: amountOutMinimum.toString()
      }
    });

    const swapTx = await routerContract.exactInputSingle(swapParams);
    const receipt = await swapTx.wait();

    logger.info('Swap executed successfully', {
      txHash: receipt.hash,
      gasUsed: receipt.gasUsed?.toString(),
      blockNumber: receipt.blockNumber
    });

    // Step 7: Calculate actual results
    const actualAmountOut = receipt.logs
      .find((log: any) => log.topics[0] === ethers.id('Transfer(address,address,uint256)'))
      ?.data || '0';

    const effectiveSlippage = actualAmountOut !== '0' 
      ? Number((estimatedAmountOut - BigInt(actualAmountOut)) * BigInt(10000) / estimatedAmountOut) / 100
      : 0;

    return {
      success: true,
      txHash: receipt.hash,
      amountOut: actualAmountOut,
      gasUsed: receipt.gasUsed?.toString(),
      effectiveSlippage
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Vincent executeSwap failed', {
      error: errorMessage,
      params,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      error: errorMessage
    };
  }
}

logger.info('Vincent executeSwap tool loaded successfully');