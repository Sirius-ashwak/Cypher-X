import { LitNodeClient } from '@litprotocol/lit-node-client';
import { PKPEthersWallet } from '@litprotocol/pkp-ethers';
import { AuthMethodScope, AuthMethodType } from '@litprotocol/constants';
import { LitContracts } from '@litprotocol/contracts-sdk';
import { ethers } from 'ethers';
import { logger } from './logger.js';

/**
 * Lit Protocol PKP Wallet Management
 * 
 * This module handles the creation and management of Programmable Key Pairs (PKPs)
 * through the Lit Protocol network. PKPs provide a secure, non-custodial wallet
 * solution where the private key is generated and managed collectively by the
 * Lit network using Distributed Key Generation (DKG).
 * 
 * Key Features:
 * - Decentralized key generation and management
 * - Policy-based transaction authorization
 * - Integration with Vincent AI guardrails
 * - No single point of failure or key exposure
 */

interface PKPInfo {
  pkpPublicKey: string;
  pkpAddress: string;
  pkpTokenId: string;
  authMethodId: string;
}

interface LitWalletConfig {
  litNetwork: string;
  rpcUrl: string;
  authSig?: any;
}

/**
 * Initialize Lit Node Client
 * Connects to the Lit Protocol network for PKP operations
 */
async function initializeLitClient(network: string = 'habanero'): Promise<LitNodeClient> {
  try {
    logger.info('Initializing Lit Node Client', { network });

    const litNodeClient = new LitNodeClient({
      litNetwork: network,
      debug: false,
      checkNodeAttestation: false, // Disable for development
    });

    await litNodeClient.connect();
    
    logger.info('Lit Node Client connected successfully', {
      network,
      connectedNodes: litNodeClient.connectedNodes?.size || 0
    });

    return litNodeClient;

  } catch (error) {
    logger.error('Failed to initialize Lit Node Client', {
      error: error instanceof Error ? error.message : 'Unknown error',
      network
    });
    throw error;
  }
}

/**
 * Create a new PKP with Vincent AI policy authorization
 * This function mints a new PKP and associates it with authentication methods
 * that allow Vincent AI policies to authorize transactions
 */
export async function createAgentPKP(config: LitWalletConfig): Promise<PKPInfo> {
  const { litNetwork, rpcUrl } = config;

  logger.info('Creating new agent PKP', { litNetwork });

  try {
    // Initialize Lit contracts for PKP minting
    const litContracts = new LitContracts({
      signer: new ethers.Wallet(process.env.PRIVATE_KEY!, new ethers.JsonRpcProvider(rpcUrl)),
      network: litNetwork,
      debug: false
    });

    await litContracts.connect();

    // Generate a unique auth method for this agent
    // In production, this would be tied to the specific Vincent policies
    const authMethodId = ethers.keccak256(
      ethers.toUtf8Bytes(`project-cypher-${Date.now()}`)
    );

    logger.info('Minting new PKP', { authMethodId });

    // Mint the PKP with authentication method
    const mintTx = await litContracts.pkpNftContract.write.mintNext(
      2, // Auth method type (custom)
      [authMethodId], // Auth method IDs
      ['0x'], // Auth method pub keys (empty for custom)
      [[]], // Auth method scopes
      true, // Add permitted addresses
      true // Send PKP to itself
    );

    const receipt = await mintTx.wait();
    
    // Extract PKP information from transaction logs
    const mintedEvent = receipt.logs.find(
      (log: any) => log.topics[0] === ethers.id('Transfer(address,address,uint256)')
    );

    if (!mintedEvent) {
      throw new Error('PKP mint event not found in transaction receipt');
    }

    const pkpTokenId = ethers.AbiCoder.defaultAbiCoder().decode(
      ['uint256'],
      mintedEvent.topics[3]
    )[0].toString();

    // Get PKP public key from token ID
    const pkpPublicKey = await litContracts.pkpNftContract.read.getPubkey(pkpTokenId);
    const pkpAddress = ethers.computeAddress(`0x${pkpPublicKey.slice(2)}`);

    logger.info('PKP created successfully', {
      pkpTokenId,
      pkpPublicKey,
      pkpAddress,
      txHash: receipt.hash
    });

    return {
      pkpPublicKey,
      pkpAddress,
      pkpTokenId,
      authMethodId
    };

  } catch (error) {
    logger.error('Failed to create agent PKP', {
      error: error instanceof Error ? error.message : 'Unknown error',
      litNetwork
    });
    throw error;
  }
}

/**
 * Get or create agent wallet
 * Checks for existing PKP configuration or creates a new one
 */
export async function createOrGetAgentWallet(config?: Partial<LitWalletConfig>): Promise<PKPEthersWallet> {
  const defaultConfig: LitWalletConfig = {
    litNetwork: process.env.LIT_NETWORK || 'habanero',
    rpcUrl: process.env.ETHEREUM_RPC_URL || process.env.POLYGON_RPC_URL || '',
    ...config
  };

  logger.info('Initializing agent wallet', defaultConfig);

  try {
    // Check if PKP already exists
    let pkpPublicKey = process.env.LIT_PKP_PUBLIC_KEY;
    
    if (!pkpPublicKey) {
      logger.info('No existing PKP found, creating new one');
      const pkpInfo = await createAgentPKP(defaultConfig);
      pkpPublicKey = pkpInfo.pkpPublicKey;
      
      logger.warn('New PKP created - Add the following to your .env file:', {
        LIT_PKP_PUBLIC_KEY: pkpPublicKey,
        PKP_ADDRESS: pkpInfo.pkpAddress,
        PKP_TOKEN_ID: pkpInfo.pkpTokenId,
        AUTH_METHOD_ID: pkpInfo.authMethodId
      });
    }

    // Initialize Lit Node Client
    const litNodeClient = await initializeLitClient(defaultConfig.litNetwork);

    // Create PKP Ethers Wallet
    const pkpWallet = new PKPEthersWallet({
      pkpPubKey: pkpPublicKey,
      rpc: defaultConfig.rpcUrl,
      litNodeClient,
      authContext: {
        authMethodType: AuthMethodType.LitAction,
        accessToken: JSON.stringify({
          authSig: defaultConfig.authSig,
          authMethodId: process.env.AUTH_METHOD_ID
        })
      }
    });

    await pkpWallet.init();

    const walletAddress = await pkpWallet.getAddress();
    
    logger.info('Agent wallet initialized successfully', {
      pkpPublicKey,
      walletAddress,
      network: defaultConfig.litNetwork
    });

    return pkpWallet;

  } catch (error) {
    logger.error('Failed to create or get agent wallet', {
      error: error instanceof Error ? error.message : 'Unknown error',
      config: defaultConfig
    });
    throw error;
  }
}

/**
 * Validate PKP wallet configuration
 * Ensures all required environment variables are present
 */
export function validatePKPConfig(): boolean {
  const requiredVars = [
    'LIT_NETWORK',
    'LIT_PKP_PUBLIC_KEY',
    'ETHEREUM_RPC_URL',
    'PRIVATE_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    logger.error('Missing required PKP configuration', { missingVars: missing });
    return false;
  }

  logger.info('PKP configuration validated successfully');
  return true;
}

logger.info('Lit Protocol PKP wallet utilities loaded successfully');